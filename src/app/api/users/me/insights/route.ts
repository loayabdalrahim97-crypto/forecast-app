import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { analyzePersonalization } from "@/lib/personalization/analyze-personalization";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { AIValidationError } from "@/lib/ai/orchestrator";
import { logAIRequest } from "@/lib/ai/log-request";

const BodySchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).default("en-us"),
});

function requireUserId(session: unknown) {
  return (session as { user?: { id?: string } } | null)?.user?.id ?? null;
}

/**
 * GET /api/users/me/insights — list previously generated insights.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const insights = await prisma.userInsight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ insights }, { status: 200 });
}

/**
 * POST /api/users/me/insights — (re)run the Personalization analysis
 * over the user's full forecast + outcome history (§19). Upserts by
 * tendencyKey so re-running doesn't pile up duplicate rows for the
 * same pattern — it refreshes the explanation instead.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine — locale defaults to en-us.
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const forecastsWithOutcome = await prisma.forecast.findMany({
    where: { userId, outcomeRecord: { isNot: null } },
    include: { variables: true, outcomeRecord: true },
  });

  const history = forecastsWithOutcome.map(
    (f: {
      situationText: string;
      variables: { kind: string; content: string }[];
      outcomeRecord: { wrongAssumptions: unknown } | null;
    }) => ({
      situationText: f.situationText,
      assumptions: f.variables.filter((v) => v.kind === "assumption").map((v) => v.content),
      wrongAssumptions: Array.isArray(f.outcomeRecord?.wrongAssumptions)
        ? (f.outcomeRecord!.wrongAssumptions as string[])
        : [],
    })
  );

  let result;
  try {
    result = await analyzePersonalization({ history, locale: parsed.data.locale });
  } catch (err) {
    console.error("[insights] personalization analysis failed:", err);
    if (err instanceof AIValidationError) {
      console.error("[insights] raw model output:", err.rawText);
    }
    return NextResponse.json({ error: "Personalization analysis failed" }, { status: 502 });
  }

  for (const insight of result.data.insights) {
    const existing = await prisma.userInsight.findFirst({
      where: { userId, tendencyKey: insight.tendencyKey },
    });
    if (existing) {
      await prisma.userInsight.update({
        where: { id: existing.id },
        data: { explanation: insight.explanation },
      });
    } else {
      await prisma.userInsight.create({
        data: { userId, tendencyKey: insight.tendencyKey, explanation: insight.explanation },
      });
    }
  }

  if (result.meta) {
    await logAIRequest(result.meta, { userId, forecastId: null });
  }

  const insights = await prisma.userInsight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ insights, historyCount: history.length }, { status: 200 });
}
