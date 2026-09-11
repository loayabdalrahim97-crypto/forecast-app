"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";

export default function UsagePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();
  const [totalForecasts, setTotalForecasts] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/decisions")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTotalForecasts(data?.decisions?.length ?? 0))
      .catch(() => setTotalForecasts(0));
  }, [status]);

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
        <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.5rem" }}>{locale === "ar" ? "الاستخدام" : "Usage"}</h1>

        <div className="fc-strip" style={{ marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
            {locale === "ar" ? "إجمالي التوقعات يلي عملتها" : "Total forecasts you've created"}
          </p>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700 }}>
            {totalForecasts === null ? "…" : totalForecasts}
          </p>
        </div>

        {/* Honest state: no per-user credit/limit system exists yet for
            signed-in users (only anonymous Free Forecast requests are
            rate-limited). Showing "X/10 used" here would be fabricated. */}
        <div className="fc-strip">
          <p style={{ margin: "0 0 0.4rem", fontWeight: 600 }}>
            {locale === "ar" ? "بدون حد استخدام حالياً" : "No usage limit right now"}
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
            {locale === "ar"
              ? "حسابك المسجّل ما عليه حد أقصى لعدد التوقعات هلق — نظام حصص/اشتراكات حقيقي جاي بمرحلة قادمة."
              : "Your signed-in account has no forecast limit right now — a real usage/credit system is coming in a later phase."}
          </p>
        </div>
      </main>
    </DashboardShell>
  );
}
