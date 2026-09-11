import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

/**
 * GET /api/decisions?category=career&outcome=with|without
 *
 * §4/§16: a user's own Decision History only — every query is scoped
 * to the session's userId, never a param the client could tamper with.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const outcomeFilter = searchParams.get("outcome"); // "with" | "without" | null

  const forecasts = await prisma.forecast.findMany({
    where: {
      userId,
      ...(category ? { category } : {}),
      ...(outcomeFilter === "with" ? { outcomeRecord: { isNot: null } } : {}),
      ...(outcomeFilter === "without" ? { outcomeRecord: null } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      situationText: true,
      category: true,
      createdAt: true,
      updatedAt: true,
      scenarios: { select: { id: true }, take: 1 },
      outcomeRecord: { select: { result: true, outcomeDate: true } },
    },
  });

  const decisions = forecasts.map((f: (typeof forecasts)[number]) => ({
    id: f.id,
    // No title column — a short derived title avoids a migration and
    // always matches the actual situation text.
    title: f.situationText.length > 80 ? `${f.situationText.slice(0, 80)}…` : f.situationText,
    category: f.category,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    hasScenarios: f.scenarios.length > 0,
    hasOutcome: f.outcomeRecord !== null,
    outcomeResult: f.outcomeRecord?.result ?? null,
  }));

  return NextResponse.json({ decisions }, { status: 200 });
}
