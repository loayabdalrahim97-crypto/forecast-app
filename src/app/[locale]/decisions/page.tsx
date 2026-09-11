"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Decision {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  hasScenarios: boolean;
  hasOutcome: boolean;
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

export default function DecisionHistoryPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("");

  useEffect(() => {
    if (status !== "authenticated") return;
    const qs = new URLSearchParams();
    if (categoryFilter) qs.set("category", categoryFilter);
    if (outcomeFilter) qs.set("outcome", outcomeFilter);
    fetch(`/api/decisions?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDecisions(data?.decisions ?? []))
      .catch(() => setDecisions([]));
  }, [status, categoryFilter, outcomeFilter]);

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.25rem" }}>{locale === "ar" ? "تاريخ القرارات" : "Decision History"}</h1>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
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
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.92rem" }}>{d.title}</p>
            <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", color: "var(--fc-text-muted)" }}>
              {d.category && <span>{locale === "ar" ? CATEGORY_LABEL[d.category]?.ar : CATEGORY_LABEL[d.category]?.en}</span>}
              <span>{new Date(d.updatedAt).toLocaleDateString(locale === "ar" ? "ar" : "en-US")}</span>
              <span>{d.hasOutcome ? (locale === "ar" ? "نتيجة مسجلة" : "Outcome recorded") : (locale === "ar" ? "بدون نتيجة" : "No outcome yet")}</span>
            </div>
          </a>
        ))
      )}
    </main>
  );
}
