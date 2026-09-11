"use client";

import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";

export default function SubscriptionPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  return (
    <DashboardShell locale={locale}>
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.5rem" }}>{locale === "ar" ? "خطتي" : "My Plan"}</h1>

        <div className="fc-strip" style={{ marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
            {locale === "ar" ? "الخطة الحالية" : "Current plan"}
          </p>
          <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>Free</p>
        </div>

        {/* Honest placeholder: no billing/Stripe integration exists yet
            (§9 explicitly forbids faking one), and no Subscription rows
            are ever created by any code path today — every account is
            implicitly on the same free tier. This button is a real
            placeholder, not a checkout flow. */}
        <button type="button" className="fc-btn fc-btn-primary" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
          {locale === "ar" ? "ترقية (قريباً)" : "Upgrade (coming soon)"}
        </button>
        <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--fc-text-muted)" }}>
          {locale === "ar"
            ? "نظام الدفع لسا ما اتبنى — هاد الزر مكانه جاهز بس مش شغال فعلياً لحد هلق."
            : "Billing isn't built yet — this button holds the spot but doesn't do anything real yet."}
        </p>
      </main>
    </DashboardShell>
  );
}
