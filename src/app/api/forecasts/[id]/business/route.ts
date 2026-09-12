import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeBusiness } from "@/lib/forecast/analyze-business";
import { AIValidationError } from "@/lib/ai/orchestrator";
import { logAIRequest } from "@/lib/ai/log-request";

/**
 * POST /api/forecasts/:id/business
 *
 * §16: Business Decision Mode. Unlike Decision Mode and the Scenario
 * Engine, this re-runs its own facts/assumptions/estimates split rather
 * than reusing the general Situation Analyzer's — §16 explicitly
 * requires distinguishing "estimates" (AI-provided, basis stated) as a
 * THIRD category, which the general analyzer doesn't have.
 *
 * §3/§16-20: uses forecast.locale, never a client-supplied locale.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const forecast = await prisma.forecast.findUnique({ where: { id: params.id } });
  if (!forecast) {
    return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
  }

  let result;
  try {
    result = await analyzeBusiness(forecast.situationText, forecast.locale);
  } catch (err) {
    console.error("[business] analysis failed:", err);
    if (err instanceof AIValidationError) {
      console.error("[business] raw model output:", err.rawText);
    }
    return NextResponse.json({ error: "Business analysis failed" }, { status: 502 });
  }

  const businessForecast = await prisma.businessForecast.upsert({
    where: { forecastId: forecast.id },
    create: {
      forecastId: forecast.id,
      facts: result.data.facts,
      assumptions: result.data.assumptions,
      estimates: result.data.estimates,
      breakEven: { description: result.data.breakEvenDescription },
      sensitivity: result.data.sensitivity,
      upside: result.data.upside,
      downside: result.data.downside,
      executionRisk: result.data.executionRisk,
      recommendation: result.data.recommendation,
    },
    update: {
      facts: result.data.facts,
      assumptions: result.data.assumptions,
      estimates: result.data.estimates,
      breakEven: { description: result.data.breakEvenDescription },
      sensitivity: result.data.sensitivity,
      upside: result.data.upside,
      downside: result.data.downside,
      executionRisk: result.data.executionRisk,
      recommendation: result.data.recommendation,
    },
  });

  await prisma.forecast.update({ where: { id: forecast.id }, data: { mode: "business" } });

  await logAIRequest(result.meta, { userId: forecast.userId, forecastId: forecast.id });

  return NextResponse.json({ businessForecast }, { status: 201 });
}
