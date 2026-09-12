import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeDecision } from "@/lib/forecast/analyze-decision";
import { AIValidationError } from "@/lib/ai/orchestrator";
import { logAIRequest } from "@/lib/ai/log-request";

const BodySchema = z.object({
  /** Optional — if omitted, the model infers the natural options (§15). */
  options: z.array(z.string().min(1).max(200)).max(6).optional().default([]),
});

/**
 * POST /api/forecasts/:id/decision
 *
 * §15: Decision Mode. Reuses the forecast's existing Situation Analysis
 * (facts/assumptions) rather than re-deriving them, then compares 2-6
 * concrete options with best/base/worst case, risk, and reversibility.
 *
 * §3/§16-20: uses forecast.locale, never a client-supplied locale.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const forecast = await prisma.forecast.findUnique({
    where: { id: params.id },
    include: { variables: true },
  });

  if (!forecast) {
    return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine.
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const facts = forecast.variables
    .filter((v: { kind: string; content: string }) => v.kind === "fact")
    .map((v: { kind: string; content: string }) => v.content);
  const assumptions = forecast.variables
    .filter((v: { kind: string; content: string }) => v.kind === "assumption")
    .map((v: { kind: string; content: string }) => v.content);

  let result;
  try {
    result = await analyzeDecision({
      situationText: forecast.situationText,
      facts,
      assumptions,
      explicitOptions: parsed.data.options,
      locale: forecast.locale,
    });
  } catch (err) {
    console.error("[decision] analysis failed:", err);
    if (err instanceof AIValidationError) {
      console.error("[decision] raw model output:", err.rawText);
    }
    return NextResponse.json({ error: "Decision analysis failed" }, { status: 502 });
  }

  const decisionAnalysis = await prisma.decisionAnalysis.upsert({
    where: { forecastId: forecast.id },
    create: {
      forecastId: forecast.id,
      options: result.data.options,
      keyVariables: result.data.keyVariables,
      recommendation: result.data.recommendation,
      contingencyPlan: result.data.contingencyPlan,
    },
    update: {
      options: result.data.options,
      keyVariables: result.data.keyVariables,
      recommendation: result.data.recommendation,
      contingencyPlan: result.data.contingencyPlan,
    },
  });

  await prisma.forecast.update({ where: { id: forecast.id }, data: { mode: "decision" } });

  await logAIRequest(result.meta, { userId: forecast.userId, forecastId: forecast.id });

  return NextResponse.json({ decisionAnalysis }, { status: 201 });
}
