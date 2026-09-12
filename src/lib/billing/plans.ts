/**
 * §4: official pricing. This is the ONLY place these numbers/limits
 * live — the pricing page, paywall, billing page, and server-side
 * usage enforcement all read from here, so a price or limit change
 * never requires touching more than one file.
 */
export type PlanId = "free" | "pro_monthly" | "pro_annual";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceUsd: number;
  interval: "month" | "year";
  forecastsPerMonth: number;
  paypalPlanIdEnvVar?: "PAYPAL_MONTHLY_PLAN_ID" | "PAYPAL_ANNUAL_PLAN_ID";
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    interval: "month",
    forecastsPerMonth: 3,
  },
  pro_monthly: {
    id: "pro_monthly",
    name: "Pro Monthly",
    priceUsd: 9.99,
    interval: "month",
    forecastsPerMonth: 30,
    paypalPlanIdEnvVar: "PAYPAL_MONTHLY_PLAN_ID",
  },
  pro_annual: {
    id: "pro_annual",
    name: "Pro Annual",
    priceUsd: 79.99,
    interval: "year",
    forecastsPerMonth: 30,
    paypalPlanIdEnvVar: "PAYPAL_ANNUAL_PLAN_ID",
  },
};

export function forecastLimitForPlan(plan: string): number {
  return PLANS[plan as PlanId]?.forecastsPerMonth ?? PLANS.free.forecastsPerMonth;
}

/** Calendar-month usage window (§3: "3 per calendar month", "resets monthly" — not a signup-anchored 30-day cycle). */
export function currentCalendarMonthStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function nextCalendarMonthStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
