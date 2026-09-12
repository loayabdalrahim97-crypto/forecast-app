import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { UpdateForecastSchema } from "@/lib/forecast/update-schema";
import { analyzeSituation, generateFollowUpQuestions } from "@/lib/forecast/analyze-situation";
import { analysisToVariableRows } from "@/lib/forecast/variable-rows";
import { deriveFirstName } from "@/lib/forecast/derive-first-name";
import { AIValidationError } from "@/lib/ai/orchestrator";
import { logAIRequest } from "@/lib/ai/log-request";

/**
 * POST /api/forecasts/:id/update-info
 *
 * §17: Forecast Update. The original situation text is preserved (this
 * route never deletes it — the additional info is appended and kept as
 * its own ForecastUpdate row, so there's a record of exactly what was
 * added and when). The analysis is recalculated against the combined
 * text, and stale scenarios are cleared since they no longer reflect
 * the current understanding — the person needs to press "Generate
 * scenarios" again on purpose rather than see outdated ones silently.
 *
 * Scoping note: this keeps one Forecast row with an updated situation
 * text plus a ForecastUpdate history, rather than building the full
 * parent/child Forecast version tree the schema supports — that's a
 * larger UI (viewing multiple historical versions side by side) for a
 * later pass.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const forecast = await prisma.forecast.findUnique({ where: { id: params.id } });
  if (!forecast) {
    return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateForecastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const combinedText = `${forecast.situationText}\n\nAdditional information:\n${parsed.data.additionalInfo}`;

  let analysisResult;
  try {
    analysisResult = await analyzeSituation(
      combinedText,
      parsed.data.locale,
      forecast.userId
        ? deriveFirstName((await prisma.user.findUnique({ where: { id: forecast.userId }, select: { name: true } }))?.name)
        : null
    );
  } catch (err) {
    console.error("[update-info] analysis failed:", err);
    if (err instanceof AIValidationError) {
      console.error("[update-info] raw model output:", err.rawText);
      return NextResponse.json({ error: "Analysis failed validation" }, { status: 502 });
    }
    return NextResponse.json({ error: "Analysis failed" }, { status: 502 });
  }

  const analysis = analysisResult.data;

  const followUp = await generateFollowUpQuestions({
    situationText: combinedText,
    unknowns: analysis.unknowns,
    locale: parsed.data.locale,
  }).catch(() => ({ data: { questions: [] as string[] }, meta: null }));

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.forecastUpdate.create({
      data: { forecastId: forecast.id, newInformation: parsed.data.additionalInfo },
    });
    await tx.forecast.update({
      where: { id: forecast.id },
      data: { situationText: combinedText, decisionPaths: analysisResult.data.decisionPaths },
    });
    // Stale — the person must regenerate deliberately.
    await tx.scenario.deleteMany({ where: { forecastId: forecast.id } });
    // Any recorded outcome referred to the now-stale scenarios too.
    await tx.outcomeRecord.deleteMany({ where: { forecastId: forecast.id } });
    await tx.forecastVariable.deleteMany({ where: { forecastId: forecast.id } });
    await tx.forecastVariable.createMany({
      data: analysisToVariableRows(analysis).map((v) => ({ ...v, forecastId: forecast.id })),
    });
    return tx.forecast.findUnique({ where: { id: forecast.id }, include: { variables: true } });
  });

  await logAIRequest(analysisResult.meta, { userId: forecast.userId, forecastId: forecast.id });
  if (followUp.meta) {
    await logAIRequest(followUp.meta, { userId: forecast.userId, forecastId: forecast.id });
  }

  return NextResponse.json(
    { forecast: updated, followUpQuestions: followUp.data.questions },
    { status: 200 }
  );
}
