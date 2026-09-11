"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Stats {
  totalUsers: number;
  totalForecasts: number;
  forecastsLast24h: number;
  forecastsLast7Days: number;
  totalScenarioSets: number;
  totalOutcomesRecorded: number;
  outcomeRecordingRate: number;
  recentSignups: { email: string; createdAt: string }[];
  forecastsByDay: { date: string; count: number }[];
}

interface CostStats {
  totalRequests: number;
  totalCostUsd: number;
  last7Days: { requests: number; costUsd: number };
  byModel: { model: string; requests: number; costUsd: number }[];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="fc-strip">
      <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export default function AdminDashboardPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [costs, setCosts] = useState<CostStats | null>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "done" | "forbidden" | "error">("idle");

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadStatus("loading");
    Promise.all([
      fetch("/api/admin/stats").then((r) => ({ ok: r.ok, status: r.status, body: r.json() })),
      fetch("/api/admin/ai-costs").then((r) => ({ ok: r.ok, status: r.status, body: r.json() })),
    ])
      .then(async ([statsRes, costsRes]) => {
        if (!statsRes.ok || !costsRes.ok) {
          setLoadStatus(statsRes.status === 403 ? "forbidden" : "error");
          return;
        }
        setStats(await statsRes.body);
        setCosts(await costsRes.body);
        setLoadStatus("done");
      })
      .catch(() => setLoadStatus("error"));
  }, [status]);

  const maxDayCount = Math.max(1, ...(stats?.forecastsByDay.map((d) => d.count) ?? [1]));

  return (
    <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 780, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.5rem" }}>
        {locale === "ar" ? "لوحة التحكم" : "Admin Dashboard"}
      </h1>

      {status === "loading" && <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>}

      {status === "unauthenticated" && (
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      )}

      {status === "authenticated" && loadStatus === "loading" && (
        <p>{locale === "ar" ? "جاري تحميل الإحصاءيات..." : "Loading stats..."}</p>
      )}

      {loadStatus === "forbidden" && (
        <p style={{ color: "var(--fc-band-high)" }}>
          {locale === "ar"
            ? `حسابك (${session?.user?.email}) مش من ضمن قائمة المدراء (ADMIN_EMAILS).`
            : `Your account (${session?.user?.email}) is not on the admin allowlist (ADMIN_EMAILS).`}
        </p>
      )}

      {loadStatus === "error" && (
        <p style={{ color: "var(--fc-band-high)" }}>{locale === "ar" ? "صار خطأ بالتحميل." : "Failed to load."}</p>
      )}

      {loadStatus === "done" && stats && costs && (
        <>
          <div className="fc-grid-2" style={{ marginBottom: "1rem" }}>
            <StatCard label={locale === "ar" ? "إجمالي المستخدمين" : "Total Users"} value={stats.totalUsers} />
            <StatCard label={locale === "ar" ? "إجمالي التوقعات" : "Total Forecasts"} value={stats.totalForecasts} />
            <StatCard label={locale === "ar" ? "توقعات آخر ٢٤ ساعة" : "Forecasts (24h)"} value={stats.forecastsLast24h} />
            <StatCard label={locale === "ar" ? "توقعات آخر ٧ أيام" : "Forecasts (7d)"} value={stats.forecastsLast7Days} />
            <StatCard
              label={locale === "ar" ? "نسبة تسجيل النتيجة" : "Outcome Recording Rate"}
              value={`${Math.round(stats.outcomeRecordingRate * 100)}%`}
            />
            <StatCard label={locale === "ar" ? "تكلفة AI الإجمالية" : "Total AI Cost"} value={`$${costs.totalCostUsd.toFixed(2)}`} />
          </div>

          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
              {locale === "ar" ? "التوقعات آخر ٧ أيام" : "Forecasts, last 7 days"}
            </h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", height: 100 }}>
              {stats.forecastsByDay.map((d) => (
                <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: `${(d.count / maxDayCount) * 80}px`,
                      background: "var(--fc-accent)",
                      borderRadius: "3px 3px 0 0",
                      minHeight: 2,
                    }}
                  />
                  <p style={{ fontSize: "0.65rem", color: "var(--fc-text-muted)", margin: "0.3rem 0 0" }}>
                    {d.date.slice(5)}
                  </p>
                  <p style={{ fontSize: "0.7rem", margin: 0 }}>{d.count}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
              {locale === "ar" ? "التكلفة حسب النموذج" : "Cost by Model"}
            </h2>
            {costs.byModel.map((m) => (
              <p key={m.model} style={{ margin: "0 0 0.3rem", fontSize: "0.88rem" }}>
                {m.model}: {m.requests} {locale === "ar" ? "طلب" : "requests"} — ${m.costUsd.toFixed(4)}
              </p>
            ))}
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
              {locale === "ar" ? "آخر ١٠ تسجيلات" : "Last 10 Signups"}
            </h2>
            {stats.recentSignups.map((u, i) => (
              <p key={i} style={{ margin: "0 0 0.3rem", fontSize: "0.85rem" }}>
                {u.email} — {new Date(u.createdAt).toLocaleDateString(locale === "ar" ? "ar" : "en-US")}
              </p>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
