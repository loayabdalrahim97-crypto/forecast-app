import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
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
import { getUsageStatus, assertUnderUsageLimit } from "@/lib/billing/usage";

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
 * §2/§3: signed-in users are now subject to real, server-enforced
 * monthly usage limits (Free: 3, Pro: 30) — checked once cheaply
 * before the expensive AI call so a blocked user never causes AI
 * spend, then re-checked atomically inside the same transaction that
 * saves the Forecast row, so two simultaneous requests can't both
 * slip through. Anonymous requests keep the existing IP rate limit
 * unchanged (§8/§26).
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
  } else {
    // Cheap pre-check before spending on an AI call — a full atomic
    // re-check happens again at save time below.
    const usage = await getUsageStatus(userId);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Monthly forecast limit reached.",
          code: "USAGE_LIMIT_REACHED",
          usage: { plan: usage.plan, limit: usage.limit, used: usage.used, periodEnd: usage.periodEnd },
        },
        { status: 402 }
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

  let forecast;
  try {
    forecast = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        if (userId) {
          const usage = await assertUnderUsageLimit(tx, userId);
          if (!usage.allowed) {
            // Thrown inside the transaction so nothing is saved and the
            // transaction rolls back cleanly — no partial Forecast row,
            // no consumed usage, matching "only consume on success".
            throw new UsageLimitError(usage.plan, usage.limit, usage.used, usage.periodEnd);
          }
        }
        return tx.forecast.create({
          data: {
            userId,
            situationText: parsed.data.situationText,
            locale: parsed.data.locale,
            mode: "general",
            decisionPaths: analysis.decisionPaths ?? [],
            variables: {
              createMany: {
                data: analysisToVariableRows(analysis),
              },
            },
          },
          include: { variables: true },
        });
      },
      { isolationLevel: "Serializable" }
    );
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json(
        {
          error: "Monthly forecast limit reached.",
          code: "USAGE_LIMIT_REACHED",
          usage: { plan: err.plan, limit: err.limit, used: err.used, periodEnd: err.periodEnd },
        },
        { status: 402 }
      );
    }
    console.error("[forecasts] failed to save forecast:", err);
    return NextResponse.json({ error: "Failed to save forecast" }, { status: 500 });
  }

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

class UsageLimitError extends Error {
  constructor(
    public plan: string,
    public limit: number,
    public used: number,
    public periodEnd: Date
  ) {
    super("Usage limit reached");
  }
}

/**
 * GET /api/forecasts/:id is handled in [id]/route.ts — this file only
 * covers creation and (later) listing.
 */
