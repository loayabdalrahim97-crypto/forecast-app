import { NextResponse } from "next/server";

/**
 * GET /api/billing/config
 *
 * §5/§22: the PayPal Client ID is the ONE PayPal value allowed
 * client-side. Routing it through this endpoint (rather than a
 * NEXT_PUBLIC_ env var) keeps the env var name exactly as specified
 * (PAYPAL_CLIENT_ID, no NEXT_PUBLIC_ prefix) while still making it
 * readable by the browser in a controlled way. PAYPAL_CLIENT_SECRET
 * is never referenced anywhere in this file or sent in this response.
 */
export async function GET() {
  return NextResponse.json(
    {
      clientId: process.env.PAYPAL_CLIENT_ID ?? null,
      monthlyPlanId: process.env.PAYPAL_MONTHLY_PLAN_ID ?? null,
      annualPlanId: process.env.PAYPAL_ANNUAL_PLAN_ID ?? null,
      mode: process.env.PAYPAL_MODE ?? "sandbox",
    },
    { status: 200 }
  );
}
