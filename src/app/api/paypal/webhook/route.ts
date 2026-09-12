import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPayPalWebhookSignature } from "@/lib/billing/paypal";

/**
 * POST /api/paypal/webhook
 *
 * §7: handles PayPal subscription lifecycle events. Every event is:
 * 1. Signature-verified against PayPal's own verification endpoint
 *    before the body is trusted at all (§22 — never trust the raw
 *    webhook body).
 * 2. Recorded by PayPal's event ID in WebhookEvent BEFORE any side
 *    effect is applied, inside the same transaction as that side
 *    effect — so a duplicate delivery of the same event is a no-op
 *    the second time (§7: idempotent processing), and a crash between
 *    "recorded" and "applied" can't happen since they're atomic
 *    together.
 */
export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("[paypal-webhook] PAYPAL_WEBHOOK_ID is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");
  const transmissionSig = req.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: "Missing PayPal signature headers" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let verified: boolean;
  try {
    verified = await verifyPayPalWebhookSignature({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookId,
      body,
    });
  } catch (err) {
    console.error("[paypal-webhook] signature verification request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  if (!verified) {
    console.error("[paypal-webhook] signature verification returned FAILURE");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventId = body.id as string | undefined;
  const eventType = body.event_type as string | undefined;
  if (!eventId || !eventType) {
    return NextResponse.json({ error: "Malformed webhook event" }, { status: 400 });
  }

  const resource = body.resource as Record<string, unknown> | undefined;
  const paypalSubscriptionId =
    eventType.startsWith("BILLING.SUBSCRIPTION") ? (resource?.id as string | undefined) : undefined;

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Idempotency: this insert fails with a unique-constraint error
      // if the event was already processed, which we treat as "done,
      // nothing more to do" rather than an error.
      await tx.webhookEvent.create({
        data: { provider: "paypal", eventId, eventType },
      });

      if (!paypalSubscriptionId) return; // Not a subscription event we act on.

      const subscription = await tx.subscription.findUnique({ where: { paypalSubscriptionId } });
      if (!subscription) {
        // A subscription we don't yet have locally (e.g. the confirm
        // endpoint hasn't run yet) — nothing to update. Not an error;
        // BILLING.SUBSCRIPTION.CREATED can arrive before our own
        // confirm step in rare timing cases.
        return;
      }

      switch (eventType) {
        case "BILLING.SUBSCRIPTION.ACTIVATED":
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "active",
              currentPeriodStart: resource?.start_time ? new Date(resource.start_time as string) : subscription.currentPeriodStart,
            },
          });
          break;
        case "BILLING.SUBSCRIPTION.UPDATED": {
          const nextBilling = (resource?.billing_info as { next_billing_time?: string } | undefined)?.next_billing_time;
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { currentPeriodEnd: nextBilling ? new Date(nextBilling) : subscription.currentPeriodEnd },
          });
          break;
        }
        case "BILLING.SUBSCRIPTION.CANCELLED":
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: "cancelled", cancelAtPeriodEnd: true },
          });
          break;
        case "BILLING.SUBSCRIPTION.SUSPENDED":
          await tx.subscription.update({ where: { id: subscription.id }, data: { status: "suspended" } });
          break;
        case "BILLING.SUBSCRIPTION.EXPIRED":
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: "expired", plan: "free" },
          });
          break;
        case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
          await tx.subscription.update({ where: { id: subscription.id }, data: { status: "payment_failed" } });
          break;
        default:
          // Recorded for idempotency above; no local state change for
          // event types we don't specifically act on (e.g. CREATED,
          // which we handle via the confirm endpoint instead).
          break;
      }
    });
  } catch (err) {
    // Unique constraint violation on WebhookEvent.eventId = already
    // processed this exact event. Prisma's error code for that is
    // P2002 — treat it as success, not a failure to retry forever.
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    console.error("[paypal-webhook] processing failed:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
