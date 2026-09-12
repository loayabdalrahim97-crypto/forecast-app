/**
 * §6/§22: all PayPal server-to-server calls live here. PAYPAL_CLIENT_SECRET
 * is read from process.env only, in this server-only module — nothing
 * in src/app/**\/*.tsx (client components) imports this file.
 */

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

/** §6: obtain (and cache until near-expiry) a PayPal OAuth access token. */
export async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not configured");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    // Never log the response body here — PayPal error payloads can
    // occasionally echo request parameters; log status only (§22: do
    // not log secrets or payment credentials).
    throw new Error(`PayPal OAuth token request failed with status ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export interface PayPalSubscriptionDetails {
  id: string;
  planId: string;
  status: string; // PayPal's own strings: APPROVAL_PENDING | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  startTime: string | null;
  billingInfo?: {
    nextBillingTime?: string;
    lastPaymentTime?: string;
  };
}

/** §6: retrieve a subscription's current status directly from PayPal — never trust a client-supplied status. */
export async function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscriptionDetails> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`PayPal subscription lookup failed with status ${res.status}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    planId: data.plan_id,
    status: data.status,
    startTime: data.start_time ?? null,
    billingInfo: data.billing_info
      ? {
          nextBillingTime: data.billing_info.next_billing_time,
          lastPaymentTime: data.billing_info.last_payment?.time,
        }
      : undefined,
  };
}

/** §6/§12: request cancellation of a subscription through PayPal (does not delete local data). */
export async function cancelPayPalSubscription(subscriptionId: string, reason: string): Promise<void> {
  const token = await getPayPalAccessToken();
  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }
  );
  // PayPal returns 204 No Content on success.
  if (!res.ok && res.status !== 204) {
    throw new Error(`PayPal subscription cancellation failed with status ${res.status}`);
  }
}

/**
 * §7/§22: verify a webhook actually came from PayPal before acting on
 * it. Uses PayPal's own verification endpoint (simpler and more
 * robust across key rotations than re-implementing the certificate
 * chain / signature check locally).
 */
export async function verifyPayPalWebhookSignature(params: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  body: unknown;
}): Promise<boolean> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      transmission_id: params.transmissionId,
      transmission_time: params.transmissionTime,
      cert_url: params.certUrl,
      auth_algo: params.authAlgo,
      transmission_sig: params.transmissionSig,
      webhook_id: params.webhookId,
      webhook_event: params.body,
    }),
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export function planIdForPlanType(planType: "pro_monthly" | "pro_annual"): string | undefined {
  return planType === "pro_monthly" ? process.env.PAYPAL_MONTHLY_PLAN_ID : process.env.PAYPAL_ANNUAL_PLAN_ID;
}

export function planTypeForPayPalPlanId(paypalPlanId: string): "pro_monthly" | "pro_annual" | null {
  if (paypalPlanId === process.env.PAYPAL_MONTHLY_PLAN_ID) return "pro_monthly";
  if (paypalPlanId === process.env.PAYPAL_ANNUAL_PLAN_ID) return "pro_annual";
  return null;
}
