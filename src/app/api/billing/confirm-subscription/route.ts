import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { getPayPalSubscription, planTypeForPayPalPlanId } from "@/lib/billing/paypal";

const BodySchema = z.object({ subscriptionId: z.string().min(1).max(100) });

/**
 * POST /api/billing/confirm-subscription
 *
 * §9: called by the client right after the PayPal button reports
 * approval. This is NOT the source of truth by itself — it looks the
 * subscription up directly on PayPal's servers and only activates
 * local Pro access if PayPal itself confirms an ACTIVE status for a
 * plan ID we recognize. A client that fabricates a subscription ID or
 * claims success without real approval gets nothing from this
 * endpoint (§22: never trust a client-provided "I paid" flag).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Prevent one user from "confirming" a PayPal subscription ID that
  // belongs to someone else's already-linked subscription.
  const existingOwner = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: parsed.data.subscriptionId },
    select: { userId: true },
  });
  if (existingOwner && existingOwner.userId !== userId) {
    return NextResponse.json({ error: "This subscription is already linked to a different account" }, { status: 409 });
  }

  let details;
  try {
    details = await getPayPalSubscription(parsed.data.subscriptionId);
  } catch (err) {
    console.error("[billing] PayPal subscription lookup failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not verify subscription with PayPal" }, { status: 502 });
  }

  const planType = planTypeForPayPalPlanId(details.planId);
  if (!planType) {
    return NextResponse.json({ error: "Unrecognized PayPal plan" }, { status: 400 });
  }

  if (details.status !== "ACTIVE" && details.status !== "APPROVAL_PENDING") {
    return NextResponse.json({ error: `Subscription is not active (PayPal status: ${details.status})` }, { status: 400 });
  }

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planType,
      status: details.status === "ACTIVE" ? "active" : "approval_pending",
      provider: "paypal",
      paypalSubscriptionId: details.id,
      paypalPlanId: details.planId,
      currentPeriodStart: details.startTime ? new Date(details.startTime) : new Date(),
      currentPeriodEnd: details.billingInfo?.nextBillingTime ? new Date(details.billingInfo.nextBillingTime) : null,
    },
    update: {
      plan: planType,
      status: details.status === "ACTIVE" ? "active" : "approval_pending",
      provider: "paypal",
      paypalSubscriptionId: details.id,
      paypalPlanId: details.planId,
      currentPeriodStart: details.startTime ? new Date(details.startTime) : undefined,
      currentPeriodEnd: details.billingInfo?.nextBillingTime ? new Date(details.billingInfo.nextBillingTime) : undefined,
      cancelAtPeriodEnd: false,
    },
  });

  return NextResponse.json({ subscription: { plan: subscription.plan, status: subscription.status } }, { status: 200 });
}
