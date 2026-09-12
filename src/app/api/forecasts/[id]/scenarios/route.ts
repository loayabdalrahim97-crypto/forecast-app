import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { generateScenarios } from "@/lib/forecast/generate-scenarios";
import { groupVariablesByKind } from "@/lib/forecast/variable-rows";
import type { ForecastVariableRow } from "@/lib/forecast/variable-rows";
import { summarizeBehavioralProfile } from "@/lib/forecast/behavioral-summary";
import { deriveFirstName } from "@/lib/forecast/derive-first-name";
import { AIValidationError } from "@/lib/ai/orchestrator";
import { isWithinRateLimit, FREE_FORECAST_RATE_LIMIT } from "@/lib/rate-limit/free-forecast-limit";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { logAIRequest } from "@/lib/ai/log-request";

const RATE_LIMIT_EVENT_NAME = "anonymous_scenarios_generated";

/**
 * POST /api/forecasts/:id/scenarios
 *
 * §13/§14: generates exactly 3 scenarios (best/most likely/worst) for
 * a forecast that already has a Situation Analysis. §9/§19: if the requester is signed in and has a
 * Behavioral Profile, it's folded into the prompt so
 * "likelyUserResponse" reflects their actual tendencies — anonymous
 * Free Forecast users just don't get that personalization (§8, still
 * fully functional without it).
 *
 * §3/§16-20: language is ALWAYS forecast.locale (the language it was
 * created in) — this endpoint no longer accepts a locale from the
 * request body at all. A forecast created in Arabic generates Arabic
 * scenarios even if the person has since switched the site's UI to
 * English; there is no client-controlled way to override that.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const forecast = await prisma.forecast.findUnique({
    where: { id: params.id },
    include: { variables: true },
  });

  if (!forecast) {
    return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
  }

  // ForecastVariable.kind is a plain String column in the database
  // (§24 — kept schemaless there for portability), but every value in
  // it was written by our own code from the fixed CATEGORY_MAP, so it's
  // safe to narrow to the literal union groupVariablesByKind expects.
  const grouped = groupVariablesByKind(
    forecast.variables.map((v: { kind: string; content: string }) => ({
      kind: v.kind as ForecastVariableRow["kind"],
      content: v.content,
    }))
  );

  let behavioralProfileSummary: string[] = [];
  let firstName: string | null = null;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (userId) {
    const [profile, user] = await Promise.all([
      prisma.behavioralProfile.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);
    behavioralProfileSummary = summarizeBehavioralProfile(profile);
    firstName = deriveFirstName(user?.name);
  } else {
    const ip = getClientIp(req);
    const since = new Date(Date.now() - FREE_FORECAST_RATE_LIMIT.windowMs);
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: { eventName: RATE_LIMIT_EVENT_NAME, source: ip, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    if (!isWithinRateLimit(recentEvents.map((e: { createdAt: Date }) => e.createdAt), new Date())) {
      return NextResponse.json(
        { error: "Free forecast limit reached. Sign up to continue." },
        { status: 429 }
      );
    }
  }

  let result;
  try {
    result = await generateScenarios({
      situationText: forecast.situationText,
      ...grouped,
      behavioralProfileSummary,
      locale: forecast.locale,
      firstName,
      decisionPaths: (forecast.decisionPaths as string[] | null) ?? null,
    });
  } catch (err) {
    console.error("[scenarios] generation failed:", err);
    if (err instanceof AIValidationError) {
      console.error("[scenarios] raw model output:", err.rawText);
      return NextResponse.json({ error: "Scenario generation failed validation" }, { status: 502 });
    }
    return NextResponse.json({ error: "Scenario generation failed" }, { status: 502 });
  }

  try {
    // Regenerating replaces the previous set rather than accumulating
    // duplicates — the accordion always shows exactly one best/likely/
    // worst set.
    await prisma.scenario.deleteMany({ where: { forecastId: forecast.id } });
    await prisma.scenario.createMany({
      data: result.data.scenarios.map((s) => ({
        forecastId: forecast.id,
        outcomeType: s.outcomeType,
        pathLabel: s.pathLabel,
        title: s.title,
        description: s.description,
        likelihood: s.likelihood,
        confidence: s.confidence,
        impact: s.impact,
        evidence: s.evidence,
        assumptions: s.assumptions,
        triggers: s.triggers,
        earlyWarningSigns: s.earlyWarningSigns,
        likelihoodIncreasesIf: s.likelihoodIncreasesIf,
        likelihoodDecreasesIf: s.likelihoodDecreasesIf,
        likelyUserResponse: s.likelyUserResponse,
        recommendedResponse: s.recommendedResponse,
        contingencyPlan: s.contingencyPlan,
      })),
    });
    await prisma.forecast.update({
      where: { id: forecast.id },
      data: {
        recommendedAction: result.data.recommendedAction,
        whatCouldChangeForecast: result.data.whatCouldChangeForecast,
        limitsOfForecast: result.data.limitsOfForecast,
      },
    });
  } catch (err) {
    console.error("[scenarios] failed to persist scenarios:", err);
    return NextResponse.json({ error: "Failed to save scenarios" }, { status: 500 });
  }

  const scenarios = await prisma.scenario.findMany({ where: { forecastId: forecast.id } });

  await logAIRequest(result.meta, { userId, forecastId: forecast.id });

  if (!userId) {
    await prisma.analyticsEvent.create({
      data: { eventName: RATE_LIMIT_EVENT_NAME, source: getClientIp(req) },
    });
  }

  return NextResponse.json(
    {
      scenarios,
      recommendedAction: result.data.recommendedAction,
      whatCouldChangeForecast: result.data.whatCouldChangeForecast,
      limitsOfForecast: result.data.limitsOfForecast,
    },
    { status: 201 }
  );
}
