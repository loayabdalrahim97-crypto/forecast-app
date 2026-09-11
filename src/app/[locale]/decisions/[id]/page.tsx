"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";
import { RealityCheckBarometer } from "@/components/reality-check-barometer";
import { ScenarioAccordion, type AccordionScenario } from "@/components/scenario-accordion";

interface ForecastVariable {
  kind: string;
  content: string;
}

interface StoredForecast {
  id: string;
  situationText: string;
  category: string | null;
  variables: ForecastVariable[];
  scenarios: AccordionScenario[];
  recommendedAction: { summary: string; conditionalBranches: { condition: string; action: string }[] } | null;
  outcomeRecord: {
    actualOutcome: string;
    outcomeDate: string;
    matchedScenarioTitle: string | null;
    whatWentRight: string[];
    whatWasMissed: string[];
    wrongAssumptions: string[];
  } | null;
}

function SectionList({ heading, items }: { heading: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--fc-text-secondary)", margin: "0 0 0.5rem" }}>{heading}</h2>
      <ul style={{ margin: 0, paddingInlineStart: "1.2rem" }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: "0.3rem", lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RevisitDecisionPage({ params }: { params: { locale: string; id: string } }) {
  const { locale, id } = params;
  const { status } = useSession();
  const [forecast, setForecast] = useState<StoredForecast | null>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "done" | "notfound" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting">("idle");

  async function handleDelete() {
    if (deleteStatus !== "confirming") {
      setDeleteStatus("confirming");
      return;
    }
    setDeleteStatus("deleting");
    const res = await fetch(`/api/decisions/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      window.location.href = `/${locale}/decisions`;
    } else {
      setDeleteStatus("idle");
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadStatus("loading");
    fetch(`/api/decisions/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setLoadStatus("notfound");
          return null;
        }
        return r.ok ? r.json() : Promise.reject();
      })
      .then((data) => {
        if (!data) return;
        setForecast(data.forecast);
        setLoadStatus("done");
      })
      .catch(() => setLoadStatus("error"));
  }, [status, id]);

  const byKind = (kind: string) => forecast?.variables.filter((v) => v.kind === kind).map((v) => v.content) ?? [];

  return (
    <DashboardShell locale={locale}>
    <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
      <a href={`/${locale}/decisions`} style={{ fontSize: "0.82rem", color: "var(--fc-text-muted)" }}>
        {locale === "ar" ? "← رجوع لتاريخ القرارات" : "← Back to Decision History"}
      </a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0.75rem 0 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>{locale === "ar" ? "مراجعة قرار" : "Revisit Decision"}</h1>
        {loadStatus === "done" && (
          <button
            type="button"
            onClick={handleDelete}
            className="fc-btn fc-btn-secondary"
            style={{ fontSize: "0.78rem", padding: "0.35rem 0.7rem", color: deleteStatus === "confirming" ? "var(--fc-band-high)" : undefined }}
            disabled={deleteStatus === "deleting"}
          >
            {deleteStatus === "confirming"
              ? locale === "ar" ? "تأكيد الحذف؟" : "Confirm delete?"
              : deleteStatus === "deleting"
                ? locale === "ar" ? "جاري الحذف..." : "Deleting..."
                : locale === "ar" ? "احذف" : "Delete"}
          </button>
        )}
      </div>

      {loadStatus === "loading" && <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>}
      {loadStatus === "notfound" && <p>{locale === "ar" ? "ما لقيناه." : "Not found."}</p>}
      {loadStatus === "error" && <p style={{ color: "var(--fc-band-high)" }}>{locale === "ar" ? "صار خطأ." : "Something went wrong."}</p>}

      {loadStatus === "done" && forecast && (
        <div>
          <h2 style={{ fontSize: "0.95rem", color: "var(--fc-text-secondary)" }}>{locale === "ar" ? "الموقف الأصلي" : "Original Situation"}</h2>
          <p style={{ marginBottom: "1.5rem" }}>{forecast.situationText}</p>

          <RealityCheckBarometer
            locale={locale}
            factsCount={byKind("fact").length}
            assumptionsCount={byKind("assumption").length}
            unknownsCount={byKind("unknown").length}
          />

          <SectionList heading={locale === "ar" ? "الحقائق" : "Known Facts"} items={byKind("fact")} />
          <SectionList heading={locale === "ar" ? "الافتراضات" : "Assumptions"} items={byKind("assumption")} />
          <SectionList heading={locale === "ar" ? "المجاهيل" : "Unknowns"} items={byKind("unknown")} />

          {forecast.scenarios.length > 0 && (
            <section style={{ marginTop: "1.5rem" }}>
              <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{locale === "ar" ? "السيناريوهات" : "Scenarios"}</h2>
              <ScenarioAccordion locale={locale} scenarios={forecast.scenarios} />
            </section>
          )}

          {forecast.recommendedAction && (
            <div className="fc-strip" style={{ marginTop: "1.5rem" }}>
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--fc-accent)" }}>
                {locale === "ar" ? "التوصية" : "Recommended Action"}
              </p>
              <p style={{ margin: 0 }}>{forecast.recommendedAction.summary}</p>
            </div>
          )}

          <section style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{locale === "ar" ? "ماذا حدث فعلياً؟" : "What Actually Happened?"}</h2>
            {!forecast.outcomeRecord ? (
              <p style={{ color: "var(--fc-text-muted)" }}>
                {locale === "ar" ? "لم تُسجَّل نتيجة لهذا القرار بعد." : "No outcome recorded for this decision yet."}
              </p>
            ) : (
              <>
                <p style={{ fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
                  {new Date(forecast.outcomeRecord.outcomeDate).toLocaleDateString(locale === "ar" ? "ar" : "en-US")}
                </p>
                <p style={{ marginBottom: "1rem" }}>{forecast.outcomeRecord.actualOutcome}</p>
                {forecast.outcomeRecord.matchedScenarioTitle && (
                  <p style={{ fontSize: "0.9rem" }}>
                    <strong>{locale === "ar" ? "أقرب سيناريو مطابق: " : "Closest matching scenario: "}</strong>
                    {forecast.outcomeRecord.matchedScenarioTitle}
                  </p>
                )}
                <SectionList heading={locale === "ar" ? "ما الذي كان صحيحاً" : "What went right"} items={forecast.outcomeRecord.whatWentRight} />
                <SectionList heading={locale === "ar" ? "ما الذي فات" : "What was missed"} items={forecast.outcomeRecord.whatWasMissed} />
                <SectionList heading={locale === "ar" ? "افتراضات غلط" : "Wrong assumptions"} items={forecast.outcomeRecord.wrongAssumptions} />
              </>
            )}
          </section>
        </div>
      )}
    </main>
    </DashboardShell>
  );
}
