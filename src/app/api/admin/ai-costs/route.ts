import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin/is-admin";

/**
 * GET /api/admin/ai-costs
 *
 * §22: "AI Cost per Forecast / per User / by Model / by Plan." This
 * covers by-model and by-request-type totals — per-user and per-plan
 * breakdowns can be added the same way once billing/plans exist.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = (session?.user as { email?: string } | undefined)?.email;

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const [totals, byModel, byRequestType, last7Days] = await Promise.all([
    prisma.aIRequest.aggregate({
      _sum: { estimatedCostUsd: true, inputTokens: true, outputTokens: true },
      _count: true,
    }),
    prisma.aIRequest.groupBy({
      by: ["model"],
      _sum: { estimatedCostUsd: true },
      _count: true,
    }),
    prisma.aIRequest.groupBy({
      by: ["requestType"],
      _sum: { estimatedCostUsd: true },
      _count: true,
    }),
    prisma.aIRequest.aggregate({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _sum: { estimatedCostUsd: true },
      _count: true,
    }),
  ]);

  return NextResponse.json(
    {
      totalRequests: totals._count,
      // estimatedCostUsd is a Prisma Decimal column — Prisma's
      // aggregate _sum returns a Decimal instance (serializes to a
      // string, not a number), which broke the admin dashboard's
      // .toFixed() call. Cast to a real number here so every consumer
      // of this endpoint gets a plain JS number as documented.
      totalCostUsd: Number(totals._sum.estimatedCostUsd ?? 0),
      totalInputTokens: totals._sum.inputTokens ?? 0,
      totalOutputTokens: totals._sum.outputTokens ?? 0,
      last7Days: {
        requests: last7Days._count,
        costUsd: Number(last7Days._sum.estimatedCostUsd ?? 0),
      },
      byModel: byModel.map((m: { model: string; _sum: { estimatedCostUsd: unknown }; _count: number }) => ({
        model: m.model,
        requests: m._count,
        costUsd: Number(m._sum.estimatedCostUsd ?? 0),
      })),
      byRequestType: byRequestType.map(
        (r: { requestType: string; _sum: { estimatedCostUsd: unknown }; _count: number }) => ({
          requestType: r.requestType,
          requests: r._count,
          costUsd: Number(r._sum.estimatedCostUsd ?? 0),
        })
      ),
    },
    { status: 200 }
  );
}
