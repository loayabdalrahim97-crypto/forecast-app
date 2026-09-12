import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { forecastLimitForPlan, currentCalendarMonthStart, nextCalendarMonthStart } from "./plans";

export interface UsageStatus {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
  allowed: boolean;
}

/**
 * §3: usage is COUNTED, never stored as a separately-incremented
 * counter — a completed, saved Forecast row is itself the record of
 * "one used credit". This means there's no separate counter that can
 * drift out of sync with reality, and a Forecast that failed before
 * being saved (AI error, validation failure, timeout) was never
 * created, so it was never counted — exactly the "only consume on
 * success" rule, satisfied by construction rather than by remembering
 * to roll back a counter on every failure path.
 */
export async function getUsageStatus(userId: string): Promise<UsageStatus> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const plan = subscription?.status === "active" ? subscription.plan : "free";
  const limit = forecastLimitForPlan(plan);

  const periodStart = currentCalendarMonthStart();
  const periodEnd = nextCalendarMonthStart();

  const used = await prisma.forecast.count({
    where: { userId, createdAt: { gte: periodStart, lt: periodEnd } },
  });

  return {
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    periodStart,
    periodEnd,
    allowed: used < limit,
  };
}

/**
 * §3: "use a transaction... so two simultaneous Forecast requests
 * cannot allow the user to exceed the limit." A Serializable
 * transaction makes the count-then-decide check atomic against a
 * concurrent request doing the same check — Postgres will abort one
 * of the two transactions with a serialization failure if they'd
 * otherwise both succeed past the limit, so the caller must be
 * prepared to retry/report an error on that conflict rather than
 * silently allow it.
 *
 * This function only checks and reports — the actual Forecast row is
 * created by the caller inside the SAME transaction (passed in as
 * `tx`) so the check and the row that "spends" it are atomic together.
 */
export async function assertUnderUsageLimit(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<UsageStatus> {
  const subscription = await tx.subscription.findUnique({ where: { userId } });
  const plan = subscription?.status === "active" ? subscription.plan : "free";
  const limit = forecastLimitForPlan(plan);

  const periodStart = currentCalendarMonthStart();
  const periodEnd = nextCalendarMonthStart();

  const used = await tx.forecast.count({
    where: { userId, createdAt: { gte: periodStart, lt: periodEnd } },
  });

  const status: UsageStatus = {
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    periodStart,
    periodEnd,
    allowed: used < limit,
  };

  return status;
}
