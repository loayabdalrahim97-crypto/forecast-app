"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";

interface Insight {
  id: string;
  tendencyKey: string;
  explanation: string;
  confirmedByUser: boolean | null;
}

export default function InsightsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<"idle" | "loading" | "error">("idle");

  function load() {
    fetch("/api/users/me/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setInsights(data?.insights ?? []))
      .catch(() => setInsights([]));
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
  }, [status]);

  async function handleRefresh() {
    setRefreshStatus("loading");
    try {
      const res = await fetch("/api/users/me/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        setRefreshStatus("error");
        return;
      }
      load();
      setRefreshStatus("idle");
    } catch {
      setRefreshStatus("error");
    }
  }

  async function confirm(id: string, confirmedByUser: boolean) {
    await fetch(`/api/users/me/insights/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmedByUser }),
    }).catch(() => {});
    load();
  }

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  return (
    <DashboardShell locale={locale}>
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1rem 0 0.5rem" }}>
          <h1 style={{ fontSize: "1.6rem", margin: 0 }}>{locale === "ar" ? "ملاحظات شخصية" : "Insights"}</h1>
          <button
            type="button"
            onClick={handleRefresh}
            className="fc-btn fc-btn-secondary"
            style={{ fontSize: "0.8rem" }}
            disabled={refreshStatus === "loading"}
          >
            {refreshStatus === "loading" ? (locale === "ar" ? "جاري..." : "Refreshing...") : locale === "ar" ? "تحديث" : "Refresh"}
          </button>
        </div>
        <p style={{ color: "var(--fc-text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          {locale === "ar"
            ? "أنماط مبنية فقط على تاريخ توقعاتك الفعلي — وليست تشخيصاً نفسياً."
            : "Patterns based only on your real forecast history — not a psychological diagnosis."}
        </p>

        {insights === null ? (
          <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        ) : insights.length === 0 ? (
          <div className="fc-strip">
            <p style={{ margin: 0 }}>{locale === "ar" ? "لا توجد بيانات كافية بعد." : "Not enough data yet."}</p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
              {locale === "ar"
                ? "حلّل مواقف أكثر وسجّل ما حدث فعلياً حتى تظهر ملاحظات موثوقة."
                : "Analyze more situations and record what actually happened for reliable insights to appear."}
            </p>
          </div>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="fc-strip" style={{ marginBottom: "0.75rem" }}>
              <p style={{ margin: "0 0 0.6rem" }}>{insight.explanation}</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => confirm(insight.id, true)}
                  className="fc-btn fc-btn-secondary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.6rem",
                    background: insight.confirmedByUser === true ? "var(--fc-positive-soft)" : "transparent",
                    color: insight.confirmedByUser === true ? "var(--fc-positive)" : undefined,
                  }}
                >
                  {locale === "ar" ? "صحيح" : "Accurate"}
                </button>
                <button
                  type="button"
                  onClick={() => confirm(insight.id, false)}
                  className="fc-btn fc-btn-secondary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.6rem",
                    background: insight.confirmedByUser === false ? "var(--fc-band-high-soft)" : "transparent",
                    color: insight.confirmedByUser === false ? "var(--fc-band-high)" : undefined,
                  }}
                >
                  {locale === "ar" ? "غير صحيح" : "Not accurate"}
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </DashboardShell>
  );
}
