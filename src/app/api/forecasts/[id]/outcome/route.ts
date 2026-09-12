import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RecordOutcomeSchema } from "@/lib/forecast/outcome-schema";
import { compareOutcomeToForecast } from "@/lib/forecast/compare-outcome";
import { AIValidationError } from "@/lib/ai/orchestrator";
import { logAIRequest } from "@/lib/ai/log-request";

/**
 * POST /api/forecasts/:id/outcome
 *
 * §18: "WHAT ACTUALLY HAPPENED?" — records the real outcome and asks
 * the AI to compare it against the scenarios that were generated, so
 * the forecast's accuracy is visible (§19 uses this to build
 * UserInsight rows in a later phase — this route only records the
 * comparison, it doesn't yet feed personalization).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const forecast = await prisma.forecast.findUnique({
    where: { id: params.id },
    include: { variables: true, scenarios: true, outcomeRecord: true },
  });

  if (!forecast) {
    return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
  }

  if (forecast.outcomeRecord) {
    return NextResponse.json(
      { error: "This forecast already has an outcome recorded" },
      { status: 409 }
    );
  }

  if (forecast.scenarios.length === 0) {
    return NextResponse.json(
      { error: "Generate scenarios before recording an outcome" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RecordOutcomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const assumptions = forecast.variables
    .filter((v: { kind: string; content: string }) => v.kind === "assumption")
    .map((v: { kind: string; content: string }) => v.content);
  const unknowns = forecast.variables
    .filter((v: { kind: string; content: string }) => v.kind === "unknown")
    .map((v: { kind: string; content: string }) => v.content);

  let comparison;
  try {
    comparison = await compareOutcomeToForecast({
      situationText: forecast.situationText,
      assumptions,
      unknowns,
      decisionPaths: (forecast.decisionPaths as string[] | null) ?? null,
      scenarios: forecast.scenarios.map(
        (s: { title: string; description: string; likelihood: string; pathLabel: string | null }) => ({
          title: s.title,
          description: s.description,
          likelihood: s.likelihood,
          pathLabel: s.pathLabel,
        })
      ),
      actualOutcome: parsed.data.actualOutcome,
      locale: forecast.locale,
    });
  } catch (err) {
    console.error("[outcome] comparison failed:", err);
    if (err instanceof AIValidationError) {
      console.error("[outcome] raw model output:", err.rawText);
    }
    return NextResponse.json({ error: "Outcome comparison failed" }, { status: 502 });
  }

  const outcomeRecord = await prisma.outcomeRecord.create({
    data: {
      forecastId: forecast.id,
      actualOutcome: parsed.data.actualOutcome,
      outcomeDate: parsed.data.outcomeDate ? new Date(parsed.data.outcomeDate) : new Date(),
      userResponse: parsed.data.userResponse,
      result: parsed.data.result,
      matchedScenarioTitle: comparison.data.matchedScenarioTitle,
      whatWentRight: comparison.data.whatWentRight,
      whatWasMissed: comparison.data.whatWasMissed,
      wrongAssumptions: comparison.data.wrongAssumptions,
      coverageGap: comparison.data.coverageGap,
      unknownsResolved: comparison.data.unknownsResolved,
    },
  });

  await logAIRequest(comparison.meta, { userId: forecast.userId, forecastId: forecast.id });

  return NextResponse.json(
    {
      outcomeRecord,
      matchedScenarioTitle: comparison.data.matchedScenarioTitle,
      coverageGap: comparison.data.coverageGap,
    },
    { status: 201 }
  );
}
