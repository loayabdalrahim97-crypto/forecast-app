import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

/**
 * GET /api/decisions/:id
 *
 * §13 (Revisit a Decision) / §16 (privacy): returns the forecast
 * exactly as it was stored — original situation, variables, scenarios,
 * decision analysis, and outcome if recorded. Never recomputed, never
 * regenerated. Ownership is checked explicitly (not just "signed in")
 * so one user can never open another user's decision by guessing an id.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const forecast = await prisma.forecast.findUnique({
    where: { id: params.id },
    include: {
      variables: true,
      scenarios: true,
      decisionAnalysis: true,
      outcomeRecord: true,
    },
  });

  if (!forecast || forecast.userId !== userId) {
    // Same response whether it doesn't exist or belongs to someone
    // else — never confirm another user's decision even exists.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ forecast }, { status: 200 });
}

/**
 * DELETE /api/decisions/:id — §10 (Settings > Privacy): delete an
 * individual decision. Ownership checked the same way as GET.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const forecast = await prisma.forecast.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!forecast || forecast.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.forecast.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true }, { status: 200 });
}
