import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { cancelPayPalSubscription } from "@/lib/billing/paypal";

/**
 * POST /api/billing/cancel
 *
 * §12: requests cancellation through PayPal, then marks the local
 * subscription cancelAtPeriodEnd — access (and the 30/month limit)
 * stays until currentPeriodEnd; nothing about the user's forecasts,
 * behavioral profile, history, or outcomes is touched here.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription || !subscription.paypalSubscriptionId) {
    return NextResponse.json({ error: "No active PayPal subscription found" }, { status: 404 });
  }

  try {
    await cancelPayPalSubscription(subscription.paypalSubscriptionId, "Customer requested cancellation");
  } catch (err) {
    console.error("[billing] PayPal cancellation failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not cancel subscription with PayPal" }, { status: 502 });
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json(
    {
      subscription: {
        status: updated.status,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        currentPeriodEnd: updated.currentPeriodEnd,
      },
    },
    { status: 200 }
  );
}
