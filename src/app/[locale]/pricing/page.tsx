"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PayPalSubscribeButton } from "@/components/paypal-subscribe-button";

export default function PricingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status: authStatus } = useSession();
  const [planIds, setPlanIds] = useState<{ monthlyPlanId: string | null; annualPlanId: string | null }>({
    monthlyPlanId: null,
    annualPlanId: null,
  });
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "confirming" | "done" | "error">("idle");

  useEffect(() => {
    fetch("/api/billing/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPlanIds({ monthlyPlanId: data.monthlyPlanId, annualPlanId: data.annualPlanId });
      });
  }, []);

  async function handleSubscribed(subscriptionId: string) {
    setSubscribeStatus("confirming");
    const res = await fetch("/api/billing/confirm-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId }),
    }).catch(() => null);
    if (res?.ok) {
      setSubscribeStatus("done");
      window.location.href = `/${locale}/billing`;
    } else {
      setSubscribeStatus("error");
    }
  }

  const isAr = locale === "ar";

  const cardStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 240,
    background: "var(--fc-bg-card)",
    border: "1px solid var(--fc-border)",
    borderRadius: "var(--fc-radius-md)",
    padding: "1.5rem",
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", textAlign: "center", marginBottom: "0.5rem" }}>
        {isAr ? "الأسعار" : "Pricing"}
      </h1>
      <p style={{ textAlign: "center", color: "var(--fc-text-secondary)", marginBottom: "2.5rem" }}>
        {isAr ? "خطة بسيطة، بدون مفاجآت." : "Simple pricing, no surprises."}
      </p>

      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{isAr ? "مجاني" : "Free"}</h2>
          <p style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0.5rem 0" }}>
            $0<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--fc-text-muted)" }}>/{isAr ? "شهر" : "mo"}</span>
          </p>
          <p style={{ color: "var(--fc-text-secondary)", marginBottom: "1.25rem" }}>
            {isAr ? "٣ توقعات شهرياً" : "3 forecasts per month"}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
            {isAr ? "خطتك الحالية إذا لم تشترك بعد." : "Your current plan if you haven't subscribed yet."}
          </p>
        </div>

        <div style={{ ...cardStyle, borderColor: "var(--fc-accent)" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{isAr ? "برو - شهري" : "Pro Monthly"}</h2>
          <p style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0.5rem 0" }}>
            $9.99<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--fc-text-muted)" }}>/{isAr ? "شهر" : "mo"}</span>
          </p>
          <p style={{ color: "var(--fc-text-secondary)", marginBottom: "1.25rem" }}>
            {isAr ? "٣٠ توقعاً شهرياً" : "30 forecasts per month"}
          </p>
          {authStatus === "authenticated" ? (
            <PayPalSubscribeButton planId={planIds.monthlyPlanId} locale={locale} onSubscribed={handleSubscribed} />
          ) : (
            <a href={`/${locale}/login`} className="fc-btn fc-btn-primary" style={{ display: "inline-block" }}>
              {isAr ? "سجل دخول للاشتراك" : "Log in to subscribe"}
            </a>
          )}
        </div>

        <div style={{ ...cardStyle, borderColor: "var(--fc-accent)", position: "relative" }}>
          <span
            style={{
              position: "absolute",
              top: -10,
              insetInlineStart: 16,
              background: "var(--fc-accent)",
              color: "#06110f",
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "0.15rem 0.6rem",
              borderRadius: 999,
            }}
          >
            {isAr ? "أفضل قيمة" : "BEST VALUE"}
          </span>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{isAr ? "برو - سنوي" : "Pro Annual"}</h2>
          <p style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0.5rem 0" }}>
            $79.99<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--fc-text-muted)" }}>/{isAr ? "سنة" : "yr"}</span>
          </p>
          <p style={{ color: "var(--fc-text-secondary)", marginBottom: "0.4rem" }}>
            {isAr ? "٣٠ توقعاً شهرياً" : "30 forecasts per month"}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--fc-accent)", marginBottom: "1.25rem" }}>
            {isAr ? "توفير حوالي ٣٣٪ مقارنة بالشهري" : "Save ~33% vs. monthly"}
          </p>
          {authStatus === "authenticated" ? (
            <PayPalSubscribeButton planId={planIds.annualPlanId} locale={locale} onSubscribed={handleSubscribed} />
          ) : (
            <a href={`/${locale}/login`} className="fc-btn fc-btn-primary" style={{ display: "inline-block" }}>
              {isAr ? "سجل دخول للاشتراك" : "Log in to subscribe"}
            </a>
          )}
        </div>
      </div>

      {subscribeStatus === "confirming" && (
        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>{isAr ? "جاري التأكيد..." : "Confirming..."}</p>
      )}
      {subscribeStatus === "error" && (
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--fc-band-high)" }}>
          {isAr ? "تعذّر تأكيد الاشتراك. حاول مرة أخرى." : "Couldn't confirm the subscription. Please try again."}
        </p>
      )}
    </main>
  );
}
