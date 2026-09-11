"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";
import { STATUS_LABEL, type ForecastStatus } from "@/lib/forecast/forecast-status";

interface Decision {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  hasScenarios: boolean;
  hasOutcome: boolean;
  status: ForecastStatus;
}

const CATEGORIES = ["career", "relationships", "finance", "business", "personal", "other"];
const CATEGORY_LABEL: Record<string, { en: string; ar: string }> = {
  career: { en: "Career", ar: "مهنة" },
  relationships: { en: "Relationships", ar: "علاقات" },
  finance: { en: "Finance", ar: "مالية" },
  business: { en: "Business", ar: "أعمال" },
  personal: { en: "Personal", ar: "شخصي" },
  other: { en: "Other", ar: "أخرى" },
};

const STATUS_COLOR: Record<ForecastStatus, string> = {
  active: "var(--fc-band-moderate)",
  updated: "var(--fc-accent)",
  resolved: "var(--fc-positive)",
};

export default function DecisionHistoryPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "created">("updated");

  useEffect(() => {
    if (status !== "authenticated") return;
    const qs = new URLSearchParams();
    if (categoryFilter) qs.set("category", categoryFilter);
    if (outcomeFilter) qs.set("outcome", outcomeFilter);
    if (search.trim()) qs.set("q", search.trim());
    qs.set("sort", sort);
    const handle = setTimeout(() => {
      fetch(`/api/decisions?${qs.toString()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setDecisions(data?.decisions ?? []))
        .catch(() => setDecisions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [status, categoryFilter, outcomeFilter, search, sort]);

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  return (
    <DashboardShell locale={locale}>
    <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.25rem" }}>{locale === "ar" ? "توقعاتي" : "My Forecasts"}</h1>

      <input
        className="fc-input"
        placeholder={locale === "ar" ? "ابحث بموقف..." : "Search a situation..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem" }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <button
          onClick={() => setCategoryFilter("")}
          className="fc-btn fc-btn-secondary"
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: categoryFilter === "" ? "var(--fc-accent-soft)" : "transparent" }}
        >
          {locale === "ar" ? "الكل" : "All"}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className="fc-btn fc-btn-secondary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: categoryFilter === c ? "var(--fc-accent-soft)" : "transparent" }}
          >
            {locale === "ar" ? CATEGORY_LABEL[c].ar : CATEGORY_LABEL[c].en}
          </button>
        ))}
        <span style={{ width: 1, background: "var(--fc-border)" }} />
        <button
          onClick={() => setOutcomeFilter(outcomeFilter === "with" ? "" : "with")}
          className="fc-btn fc-btn-secondary"
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: outcomeFilter === "with" ? "var(--fc-accent-soft)" : "transparent" }}
        >
          {locale === "ar" ? "فيها نتيجة" : "With outcomes"}
        </button>
        <button
          onClick={() => setOutcomeFilter(outcomeFilter === "without" ? "" : "without")}
          className="fc-btn fc-btn-secondary"
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: outcomeFilter === "without" ? "var(--fc-accent-soft)" : "transparent" }}
        >
          {locale === "ar" ? "بدون نتيجة" : "Without outcomes"}
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--fc-text-muted)", marginInlineEnd: "0.5rem" }}>
          {locale === "ar" ? "ترتيب حسب:" : "Sort by:"}
        </label>
        <select className="fc-input" style={{ width: "auto", marginBottom: 0, display: "inline-block" }} value={sort} onChange={(e) => setSort(e.target.value as "updated" | "created")}>
          <option value="updated">{locale === "ar" ? "آخر تحديث" : "Last updated"}</option>
          <option value="created">{locale === "ar" ? "تاريخ الإنشاء" : "Date created"}</option>
        </select>
      </div>

      {decisions === null ? (
        <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      ) : decisions.length === 0 ? (
        <div className="fc-strip">
          <p style={{ margin: 0 }}>{locale === "ar" ? "ما في قرارات تطابق هالفلتر." : "No decisions match this filter."}</p>
        </div>
      ) : (
        decisions.map((d) => (
          <a
            key={d.id}
            href={`/${locale}/decisions/${d.id}`}
            className="fc-strip"
            style={{ display: "block", marginBottom: "0.75rem", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.92rem" }}>{d.title}</p>
              <span className="fc-pill" style={{ color: STATUS_COLOR[d.status], background: "var(--fc-bg-elevated)", flexShrink: 0 }}>
                {locale === "ar" ? STATUS_LABEL[d.status].ar : STATUS_LABEL[d.status].en}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", color: "var(--fc-text-muted)" }}>
              {d.category && <span>{locale === "ar" ? CATEGORY_LABEL[d.category]?.ar : CATEGORY_LABEL[d.category]?.en}</span>}
              <span>{new Date(d.updatedAt).toLocaleDateString(locale === "ar" ? "ar" : "en-US")}</span>
            </div>
          </a>
        ))
      )}
    </main>
    </DashboardShell>
  );
}
