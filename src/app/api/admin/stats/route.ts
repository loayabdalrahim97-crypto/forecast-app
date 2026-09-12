import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { checkCurrentUserAdmin } from "@/lib/admin/check-admin";

/**
 * GET /api/admin/stats
 *
 * Site-level usage numbers for the admin dashboard: users, forecasts,
 * scenarios generated, outcomes recorded, and a 7-day forecast trend.
 * Real database-backed role check (§ Role-Based Access Control) — not
 * an email allowlist checked at request time; see check-admin.ts.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const { isAdmin } = await checkCurrentUserAdmin(userId);

  if (!isAdmin) {
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
    forecastsByLocale,
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
    // §28: "Forecasts by language" - real counts only, grouped by the
    // language each forecast was actually created in.
    prisma.forecast.groupBy({ by: ["locale"], _count: { _all: true } }),
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

  const localeRows = forecastsByLocale as { locale: string; _count: { _all: number } }[];
  const languageBreakdown = localeRows
    .map((row) => ({
      locale: row.locale,
      count: row._count._all,
      percentage: totalForecasts > 0 ? Math.round((row._count._all / totalForecasts) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

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
      forecastsByLanguage: languageBreakdown,
    },
    { status: 200 }
  );
}
