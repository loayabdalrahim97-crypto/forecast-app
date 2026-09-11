import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin/is-admin";

/**
 * GET /api/admin/stats
 *
 * Site-level usage numbers for the admin dashboard: users, forecasts,
 * scenarios generated, outcomes recorded, and a 7-day forecast trend.
 * Same fail-closed authorization as /api/admin/ai-costs.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = (session?.user as { email?: string } | undefined)?.email;

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalForecasts,
    forecastsLast24h,
    forecastsLast7Days,
    totalScenarioSets,
    totalOutcomesRecorded,
    recentSignups,
    recentForecasts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.forecast.count(),
    prisma.forecast.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.forecast.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.scenario.groupBy({ by: ["forecastId"] }).then((rows: unknown[]) => rows.length),
    prisma.outcomeRecord.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { email: true, createdAt: true },
    }),
    prisma.forecast.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Bucket the last 7 days of forecasts by day for a simple trend chart.
  const dayBuckets: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayBuckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const f of recentForecasts as { createdAt: Date }[]) {
    const key = f.createdAt.toISOString().slice(0, 10);
    if (key in dayBuckets) dayBuckets[key] += 1;
  }

  return NextResponse.json(
    {
      totalUsers,
      totalForecasts,
      forecastsLast24h,
      forecastsLast7Days,
      totalScenarioSets,
      totalOutcomesRecorded,
      outcomeRecordingRate: totalForecasts > 0 ? totalOutcomesRecorded / totalForecasts : 0,
      recentSignups,
      forecastsByDay: Object.entries(dayBuckets).map(([date, count]) => ({ date, count })),
    },
    { status: 200 }
  );
}
