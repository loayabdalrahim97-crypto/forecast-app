"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-nav";

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
  forecastsByLanguage: { locale: string; count: number; percentage: number }[];
}

interface CostStats {
  totalRequests: number;
  totalCostUsd: number;
  last7Days: { requests: number; costUsd: number };
  byModel: { model: string; requests: number; costUsd: number }[];
}

interface ActivityEntry {
  id: string;
  actorUserId: string;
  action: string;
  targetUserId: string | null;
  detail: string | null;
  createdAt: string;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="fc-strip">
      <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export function AdminDashboardClient({ locale }: { locale: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [costs, setCosts] = useState<CostStats | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/admin/ai-costs").then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/admin/activity").then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([statsData, costsData, activityData]) => {
        setStats(statsData);
        setCosts(costsData);
        setActivity(activityData.entries);
        setLoadStatus("done");
      })
      .catch(() => setLoadStatus("error"));
  }, []);

  const maxDayCount = Math.max(1, ...(stats?.forecastsByDay.map((d) => d.count) ?? [1]));

  return (
    <DashboardShell locale={locale}>
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 780, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1rem 0 1.5rem" }}>
          <h1 style={{ fontSize: "1.6rem", margin: 0 }}>
            {locale === "ar" ? "مركز التحكم" : "Control Center"}
          </h1>
          <a href={`/${locale}/admin/users`} className="fc-btn fc-btn-secondary" style={{ fontSize: "0.82rem" }}>
            {locale === "ar" ? "المستخدمون" : "Users"}
          </a>
        </div>

        {loadStatus === "loading" && <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>}
        {loadStatus === "error" && <p style={{ color: "var(--fc-band-high)" }}>{locale === "ar" ? "صار خطأ بالتحميل." : "Failed to load."}</p>}

        {loadStatus === "done" && stats && costs && (
          <>
            <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "نظرة عامة" : "Overview"}</h2>
            <div className="fc-grid-2" style={{ marginBottom: "1.5rem" }}>
              <StatCard label={locale === "ar" ? "إجمالي المستخدمين" : "Total Users"} value={stats.totalUsers} />
              <StatCard label={locale === "ar" ? "إجمالي التوقعات" : "Total Forecasts"} value={stats.totalForecasts} />
              <StatCard label={locale === "ar" ? "توقعات آخر ٢٤ ساعة" : "Forecasts (24h)"} value={stats.forecastsLast24h} />
              <StatCard label={locale === "ar" ? "توقعات آخر ٧ أيام" : "Forecasts (7d)"} value={stats.forecastsLast7Days} />
              <StatCard
                label={locale === "ar" ? "نسبة تسجيل النتيجة" : "Outcome Recording Rate"}
                value={`${Math.round(stats.outcomeRecordingRate * 100)}%`}
              />
              <StatCard label={locale === "ar" ? "تكلفة AI الإجمالية" : "Total AI Cost"} value={`$${Number(costs.totalCostUsd).toFixed(2)}`} />
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
                    <p style={{ fontSize: "0.65rem", color: "var(--fc-text-muted)", margin: "0.3rem 0 0" }}>{d.date.slice(5)}</p>
                    <p style={{ fontSize: "0.7rem", margin: 0 }}>{d.count}</p>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "تكلفة الذكاء الاصطناعي" : "AI Usage"}</h2>
              {costs.byModel.map((m) => (
                <p key={m.model} style={{ margin: "0 0 0.3rem", fontSize: "0.88rem" }}>
                  {m.model}: {m.requests} {locale === "ar" ? "طلب" : "requests"} — ${Number(m.costUsd).toFixed(4)}
                </p>
              ))}
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
                {locale === "ar" ? "التوقعات حسب اللغة" : "Forecasts by Language"}
              </h2>
              {stats.forecastsByLanguage.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
                  {locale === "ar" ? "لا توجد بيانات كافية." : "Not enough data."}
                </p>
              ) : (
                stats.forecastsByLanguage.map((row) => (
                  <div key={row.locale} style={{ marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                      <span>{row.locale}</span>
                      <span style={{ color: "var(--fc-text-muted)" }}>
                        {row.count} ({row.percentage}%)
                      </span>
                    </div>
                    <div style={{ height: 5, background: "var(--fc-bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${row.percentage}%`, background: "var(--fc-accent)" }} />
                    </div>
                  </div>
                ))
              )}
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "آخر ١٠ تسجيلات" : "Last 10 Signups"}</h2>
              {stats.recentSignups.map((u, i) => (
                <p key={i} style={{ margin: "0 0 0.3rem", fontSize: "0.85rem" }}>
                  {u.email} — {new Date(u.createdAt).toLocaleDateString(locale === "ar" ? "ar" : "en-US")}
                </p>
              ))}
            </section>

            <section>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "سجل النشاط الإداري" : "Activity Log"}</h2>
              {!activity || activity.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
                  {locale === "ar" ? "لا يوجد نشاط بعد." : "No activity yet."}
                </p>
              ) : (
                activity.map((entry) => (
                  <p key={entry.id} style={{ margin: "0 0 0.3rem", fontSize: "0.82rem", color: "var(--fc-text-secondary)" }}>
                    {entry.action} — {entry.detail} — {new Date(entry.createdAt).toLocaleString(locale === "ar" ? "ar" : "en-US")}
                  </p>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </DashboardShell>
  );
}
