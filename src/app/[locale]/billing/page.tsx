"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";

interface BillingStatus {
  plan: string;
  planName: string;
  usage: { used: number; limit: number; remaining: number; periodEnd: string };
  subscription: { status: string; provider: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
}

export default function BillingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status: authStatus } = useSession();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [cancelStatus, setCancelStatus] = useState<"idle" | "confirming" | "loading" | "done" | "error">("idle");
  const isAr = locale === "ar";

  function load() {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setBilling)
      .catch(() => setBilling(null));
  }

  useEffect(() => {
    if (authStatus === "authenticated") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  async function handleCancel() {
    if (cancelStatus !== "confirming") {
      setCancelStatus("confirming");
      return;
    }
    setCancelStatus("loading");
    const res = await fetch("/api/billing/cancel", { method: "POST" }).catch(() => null);
    if (res?.ok) {
      setCancelStatus("done");
      load();
    } else {
      setCancelStatus("error");
    }
  }

  if (authStatus === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 560, margin: "0 auto" }}>
        <p>{isAr ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  return (
    <DashboardShell locale={locale}>
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.5rem" }}>{isAr ? "الفوترة" : "Billing"}</h1>

        {!billing ? (
          <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
        ) : (
          <>
            <div className="fc-strip" style={{ marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                {isAr ? "الخطة الحالية" : "Current plan"}
              </p>
              <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>{billing.planName}</p>
            </div>

            <div className="fc-strip" style={{ marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                {isAr ? "الاستخدام" : "Usage"}
              </p>
              <p style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 600 }}>
                {billing.usage.used} / {billing.usage.limit} {isAr ? "توقع" : "forecasts"}
              </p>
              <div style={{ height: 6, background: "var(--fc-bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, (billing.usage.used / billing.usage.limit) * 100)}%`,
                    background: billing.usage.used >= billing.usage.limit ? "var(--fc-band-high)" : "var(--fc-accent)",
                  }}
                />
              </div>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                {isAr ? "يُعاد الاستخدام في " : "Resets on "}
                {new Date(billing.usage.periodEnd).toLocaleDateString(isAr ? "ar" : "en-US")}
              </p>
            </div>

            {billing.subscription && billing.subscription.provider === "paypal" && (
              <div className="fc-strip" style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                  {isAr ? "حالة الاشتراك" : "Subscription status"}
                </p>
                <p style={{ margin: "0 0 0.3rem", fontWeight: 600 }}>{billing.subscription.status}</p>
                {billing.subscription.currentPeriodEnd && (
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fc-text-secondary)" }}>
                    {billing.subscription.cancelAtPeriodEnd
                      ? isAr
                        ? `اشتراكك ملغى وسيبقى فعالاً حتى ${new Date(billing.subscription.currentPeriodEnd).toLocaleDateString("ar")}.`
                        : `Your subscription is cancelled and will remain active until ${new Date(billing.subscription.currentPeriodEnd).toLocaleDateString("en-US")}.`
                      : isAr
                        ? `تاريخ الفوترة القادم: ${new Date(billing.subscription.currentPeriodEnd).toLocaleDateString("ar")}`
                        : `Next billing date: ${new Date(billing.subscription.currentPeriodEnd).toLocaleDateString("en-US")}`}
                  </p>
                )}
                {billing.subscription.status === "payment_failed" && (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--fc-band-high)" }}>
                    {isAr
                      ? "في مشكلة بدفعتك عبر PayPal. رجاءً حدّث وسيلة الدفع للحفاظ على وصول Pro."
                      : "There's a problem with your PayPal payment. Please update your payment method to keep Pro access."}
                  </p>
                )}
                {!billing.subscription.cancelAtPeriodEnd && billing.subscription.status === "active" && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="fc-btn fc-btn-secondary"
                    style={{ marginTop: "0.85rem", fontSize: "0.82rem", color: "var(--fc-band-high)" }}
                    disabled={cancelStatus === "loading"}
                  >
                    {cancelStatus === "confirming"
                      ? isAr ? "تأكيد الإلغاء؟" : "Confirm cancellation?"
                      : cancelStatus === "loading"
                        ? isAr ? "جاري الإلغاء..." : "Cancelling..."
                        : isAr ? "إلغاء الاشتراك" : "Cancel subscription"}
                  </button>
                )}
              </div>
            )}

            {billing.plan === "free" && (
              <a href={`/${locale}/pricing`} className="fc-btn fc-btn-primary" style={{ display: "inline-block" }}>
                {isAr ? "الترقية إلى Pro" : "Upgrade to Pro"}
              </a>
            )}
          </>
        )}
      </main>
    </DashboardShell>
  );
}
