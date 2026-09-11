import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { CreateForecastSchema } from "@/lib/forecast/schema";
import { analyzeSituation, generateFollowUpQuestions } from "@/lib/forecast/analyze-situation";
import { analysisToVariableRows } from "@/lib/forecast/variable-rows";
import { deriveFirstName } from "@/lib/forecast/derive-first-name";
import { AIValidationError } from "@/lib/ai/orchestrator";
import { isWithinRateLimit, FREE_FORECAST_RATE_LIMIT } from "@/lib/rate-limit/free-forecast-limit";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { logAIRequest } from "@/lib/ai/log-request";

const RATE_LIMIT_EVENT_NAME = "anonymous_forecast_created";

/**
 * POST /api/forecasts
 * Body: { situationText: string }
 *
 * §8: works for both signed-in users and anonymous visitors (Free
 * Forecast) — Forecast.userId is nullable specifically for this. §11:
 * runs the Situation Analyzer and persists facts/assumptions/unknowns/
 * variables as separate rows. §12: only asks follow-up questions when
 * there are unknowns worth asking about.
 *
 * §8/§26: signed-in users are trusted (their account is the abuse
 * boundary — a real credit system comes in a later phase). Anonymous
 * requests are rate-limited by IP using AnalyticsEvent as a lightweight
 * request log, since that table already exists for exactly this kind
 * of "did this happen recently" query.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  if (!userId) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateForecastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let analysisResult;
  try {
    // §13 (name-only personalization): looked up fresh from the DB
    // rather than trusted from the session token, since the JWT
    // callback here doesn't copy `name` onto the token by default.
    const firstName = userId
      ? deriveFirstName((await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name)
      : null;
    analysisResult = await analyzeSituation(parsed.data.situationText, parsed.data.locale, firstName);
  } catch (err) {
    console.error("[forecasts] analysis failed:", err);
    if (err instanceof AIValidationError) {
      console.error("[forecasts] raw model output:", err.rawText);
      return NextResponse.json({ error: "Analysis failed validation" }, { status: 502 });
    }
    return NextResponse.json({ error: "Analysis failed" }, { status: 502 });
  }

  const analysis = analysisResult.data;

  const followUp = await generateFollowUpQuestions({
    situationText: parsed.data.situationText,
    unknowns: analysis.unknowns,
    locale: parsed.data.locale,
  }).catch(() => ({ data: { questions: [] as string[] }, meta: null }));

  const forecast = await prisma.forecast.create({
    data: {
      userId,
      situationText: parsed.data.situationText,
      mode: "general",
      variables: {
        createMany: {
          data: analysisToVariableRows(analysis),
        },
      },
    },
    include: { variables: true },
  });

  await logAIRequest(analysisResult.meta, { userId, forecastId: forecast.id });
  if (followUp.meta) {
    await logAIRequest(followUp.meta, { userId, forecastId: forecast.id });
  }

  if (!userId) {
    await prisma.analyticsEvent.create({
      data: { eventName: RATE_LIMIT_EVENT_NAME, source: getClientIp(req) },
    });
  }

  return NextResponse.json(
    {
      forecast,
      followUpQuestions: followUp.data.questions,
    },
    { status: 201 }
  );
}

/**
 * GET /api/forecasts/:id is handled in [id]/route.ts — this file only
 * covers creation and (later) listing.
 */
