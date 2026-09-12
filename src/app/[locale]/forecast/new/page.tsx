"use client";

import { useState } from "react";
import { RealityCheckBarometer } from "@/components/reality-check-barometer";
import { computeRealityCheck } from "@/lib/forecast/reality-check";
import { diffForecastVariables, isDiffEmpty, type ForecastDiff } from "@/lib/forecast/diff-variables";
import { ExecutiveSummary } from "@/components/executive-summary";
import { ScenarioAccordion, type AccordionScenario } from "@/components/scenario-accordion";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import type { ForecastReportData } from "@/lib/pdf/generate-forecast-report";
import { t } from "@/lib/i18n/messages";

type Band = "low" | "moderate" | "high";

function normalizeBand(value: string): Band {
  const v = value.toLowerCase();
  if (v === "low" || v === "moderate" || v === "high") return v;
  return "moderate";
}

interface ForecastVariable {
  kind: string;
  content: string;
}

interface ForecastResult {
  forecast: {
    id: string;
    variables: ForecastVariable[];
  };
  followUpQuestions: string[];
}

function SectionList({ locale, headingKey, items }: { locale: string; headingKey: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontSize: "0.95rem", fontFamily: "var(--fc-font-sans)", fontWeight: 600, color: "var(--fc-text-secondary)", margin: "0 0 0.5rem" }}>
        {t(locale, headingKey)}
      </h2>
      <ul style={{ margin: 0, paddingInlineStart: "1.2rem", color: "var(--fc-text-primary)" }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: "0.3rem", lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface DecisionOption {
  option: string;
  upside: string[];
  downside: string[];
  risk: string;
  reversibility: string;
  bestCase: string;
  baseCase: string;
  worstCase: string;
}

interface DecisionAnalysisResult {
  options: DecisionOption[];
  keyVariables: string[];
  recommendation: string;
  contingencyPlan: string;
}

function DecisionOptionCard({ locale, opt }: { locale: string; opt: DecisionOption }) {
  return (
    <div
      className="fc-strip"
      style={{ ["--fc-strip-color" as string]: `var(--fc-band-${normalizeBand(opt.risk)})`, marginBottom: "1rem" }}
    >
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>{opt.option}</h3>
      <div className="fc-grid-2" style={{ marginBottom: "0.9rem" }}>
        <SectionList locale={locale} headingKey="decision.upside" items={opt.upside} />
        <SectionList locale={locale} headingKey="decision.downside" items={opt.downside} />
      </div>
      <div style={{ borderTop: "1px solid var(--fc-border)", paddingTop: "0.75rem", display: "grid", gap: "0.4rem", fontSize: "0.88rem" }}>
        <p style={{ margin: 0 }}><span style={{ color: "var(--fc-text-muted)" }}>{t(locale, "decision.risk")}</span>: {opt.risk}</p>
        <p style={{ margin: 0 }}><span style={{ color: "var(--fc-text-muted)" }}>{t(locale, "decision.reversibility")}</span>: {opt.reversibility}</p>
        <p style={{ margin: 0 }}><span style={{ color: "var(--fc-text-muted)" }}>{t(locale, "decision.bestCase")}</span>: {opt.bestCase}</p>
        <p style={{ margin: 0 }}><span style={{ color: "var(--fc-text-muted)" }}>{t(locale, "decision.baseCase")}</span>: {opt.baseCase}</p>
        <p style={{ margin: 0 }}><span style={{ color: "var(--fc-text-muted)" }}>{t(locale, "decision.worstCase")}</span>: {opt.worstCase}</p>
      </div>
    </div>
  );
}

export default function NewForecastPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [situationText, setSituationText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [scenarioStatus, setScenarioStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [scenarios, setScenarios] = useState<AccordionScenario[]>([]);
  const [scenarioErrorMessage, setScenarioErrorMessage] = useState<string | null>(null);
  const [recommendedAction, setRecommendedAction] = useState<{
    summary: string;
    conditionalBranches: { condition: string; action: string }[];
  } | null>(null);
  const [whatCouldChangeForecast, setWhatCouldChangeForecast] = useState<string[]>([]);
  const [limitsOfForecast, setLimitsOfForecast] = useState<string | null>(null);

  const [actualOutcome, setActualOutcome] = useState("");
  const [resultTag, setResultTag] = useState<string | null>(null);
  const [reminderInterval, setReminderInterval] = useState<string>("");
  const [outcomeStatus, setOutcomeStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [outcomeResult, setOutcomeResult] = useState<{
    matchedScenarioTitle: string | null;
    outcomeRecord: { whatWentRight: string[]; whatWasMissed: string[]; wrongAssumptions: string[] };
  } | null>(null);

  const [decisionOptionsInput, setDecisionOptionsInput] = useState("");
  const [decisionStatus, setDecisionStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [decisionResult, setDecisionResult] = useState<DecisionAnalysisResult | null>(null);

  const [additionalInfo, setAdditionalInfo] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "loading" | "error">("idle");
  const [scenariosStale, setScenariosStale] = useState(false);
  const [forecastDiff, setForecastDiff] = useState<ForecastDiff | null>(null);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!situationText.trim()) return;

    setStatus("loading");
    setErrorMessage(null);
    setScenarios([]);
    setScenarioStatus("idle");
    setScenariosStale(false);
    try {
      const res = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situationText, locale }),
      });
      if (!res.ok) {
        setErrorMessage(res.status === 429 ? t(locale, "errors.rateLimited") : t(locale, "errors.generic"));
        setStatus("error");
        return;
      }
      const data = (await res.json()) as ForecastResult;
      setResult(data);
      setStatus("done");
    } catch {
      setErrorMessage(t(locale, "errors.generic"));
      setStatus("error");
    }
  }

  async function handleGenerateScenarios() {
    if (!result) return;
    setScenarioStatus("loading");
    setScenarioErrorMessage(null);
    try {
      const res = await fetch(`/api/forecasts/${result.forecast.id}/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        setScenarioErrorMessage(res.status === 429 ? t(locale, "errors.rateLimited") : t(locale, "errors.generic"));
        setScenarioStatus("error");
        return;
      }
      const data = (await res.json()) as {
        scenarios: AccordionScenario[];
        recommendedAction: { summary: string; conditionalBranches: { condition: string; action: string }[] };
        whatCouldChangeForecast: string[];
        limitsOfForecast: string | null;
      };
      setScenarios(data.scenarios);
      setRecommendedAction(data.recommendedAction ?? null);
      setWhatCouldChangeForecast(data.whatCouldChangeForecast ?? []);
      setLimitsOfForecast(data.limitsOfForecast ?? null);
      setScenarioStatus("done");
      setScenariosStale(false);
    } catch {
      setScenarioErrorMessage(t(locale, "errors.generic"));
      setScenarioStatus("error");
    }
  }

  async function handleUpdateForecast(e: React.FormEvent) {
    e.preventDefault();
    if (!result || !additionalInfo.trim()) return;

    setUpdateStatus("loading");
    const before = {
      facts: byKind("fact"),
      assumptions: byKind("assumption"),
      unknowns: byKind("unknown"),
    };
    try {
      const res = await fetch(`/api/forecasts/${result.forecast.id}/update-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalInfo, locale }),
      });
      if (!res.ok) {
        setUpdateStatus("error");
        return;
      }
      const data = await res.json();
      const newVariables: ForecastVariable[] = data.forecast.variables;
      const after = {
        facts: newVariables.filter((v) => v.kind === "fact").map((v) => v.content),
        assumptions: newVariables.filter((v) => v.kind === "assumption").map((v) => v.content),
        unknowns: newVariables.filter((v) => v.kind === "unknown").map((v) => v.content),
      };
      setForecastDiff(diffForecastVariables(before, after));
      setResult({ forecast: data.forecast, followUpQuestions: data.followUpQuestions });
      setAdditionalInfo("");
      setUpdateStatus("idle");
      if (scenarios.length > 0) {
        setScenariosStale(true);
      }
      // The outcome (if any) was recorded against the old scenarios,
      // which are now stale too — clear it so the UI doesn't show a
      // "matched scenario" that no longer exists.
      setOutcomeStatus("idle");
      setOutcomeResult(null);
      setActualOutcome("");
      setResultTag(null);
    } catch {
      setUpdateStatus("error");
    }
  }

  async function handleSetReminder(interval: string) {
    setReminderInterval(interval);
    if (!result) return;
    await fetch(`/api/forecasts/${result.forecast.id}/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval: interval || null }),
    }).catch(() => {});
  }

  async function handleAnalyzeDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setDecisionStatus("loading");
    try {
      const options = decisionOptionsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/forecasts/${result.forecast.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, options }),
      });
      if (!res.ok) {
        setDecisionStatus("error");
        return;
      }
      const data = await res.json();
      setDecisionResult(data.decisionAnalysis);
      setDecisionStatus("done");
    } catch {
      setDecisionStatus("error");
    }
  }

  async function handleRecordOutcome(e: React.FormEvent) {
    e.preventDefault();
    if (!result || !actualOutcome.trim()) return;
    setOutcomeStatus("loading");
    try {
      const res = await fetch(`/api/forecasts/${result.forecast.id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualOutcome, result: resultTag ?? undefined, locale }),
      });
      if (!res.ok) {
        setOutcomeStatus("error");
        return;
      }
      const data = await res.json();
      setOutcomeResult(data);
      setOutcomeStatus("done");
    } catch {
      setOutcomeStatus("error");
    }
  }

  const byKind = (kind: string) =>
    result?.forecast.variables.filter((v) => v.kind === kind).map((v) => v.content) ?? [];

  const factsCount = byKind("fact").length;
  const assumptionsCount = byKind("assumption").length;
  const unknownsCount = byKind("unknown").length;

  const mostLikely = scenarios.find((s) => s.outcomeType === "most_likely") ?? scenarios[0];
  const realityCheck = computeRealityCheck(factsCount, assumptionsCount, unknownsCount);
  const realityCheckBadgeLabel =
    realityCheck.badge === "grounded"
      ? t(locale, "realityCheck.grounded")
      : realityCheck.badge === "high_assumption"
        ? t(locale, "realityCheck.highAssumption")
        : t(locale, "realityCheck.mixed");

  function buildReportData(): ForecastReportData {
    return {
      locale,
      situationText,
      facts: byKind("fact"),
      assumptions: byKind("assumption"),
      unknowns: byKind("unknown"),
      behavioralVariables: byKind("behavioral"),
      externalVariables: byKind("external"),
      controllableVariables: byKind("controllable"),
      uncontrollableVariables: byKind("uncontrollable"),
      realityCheckLabel: realityCheckBadgeLabel,
      scenarios: scenarios.map((s) => ({
        outcomeType: s.outcomeType,
        pathLabel: s.pathLabel ?? null,
        title: s.title,
        description: s.description,
        likelihood: s.likelihood,
        confidence: s.confidence,
        impact: s.impact,
        evidence: Array.isArray(s.evidence) ? (s.evidence as string[]) : [],
        triggers: Array.isArray(s.triggers) ? (s.triggers as string[]) : [],
        earlyWarningSigns: Array.isArray(s.earlyWarningSigns) ? (s.earlyWarningSigns as string[]) : [],
        recommendedResponse: s.recommendedResponse,
      })),
      recommendedAction,
      whatCouldChangeForecast,
      limitsOfForecast,
      updateNote: forecastDiff && !isDiffEmpty(forecastDiff)
        ? [...forecastDiff.addedFacts, ...forecastDiff.removedAssumptions, ...forecastDiff.removedUnknowns]
            .map((item) => `• ${item}`)
            .join("\n") || null
        : null,
      outcome: outcomeResult
        ? {
            matchedScenarioTitle: outcomeResult.matchedScenarioTitle,
            whatWentRight: outcomeResult.outcomeRecord.whatWentRight,
            whatWasMissed: outcomeResult.outcomeRecord.whatWasMissed,
            wrongAssumptions: outcomeResult.outcomeRecord.wrongAssumptions,
          }
        : null,
    };
  }

  return (
    <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.5rem" }}>Foresee</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="situation" className="fc-label">{t(locale, "forecast.situationLabel")}</label>
        <textarea
          id="situation"
          className="fc-textarea"
          value={situationText}
          onChange={(e) => setSituationText(e.target.value)}
          placeholder={t(locale, "forecast.situationPlaceholder")}
          rows={5}
          style={{ marginBottom: "1rem", resize: "vertical" }}
        />
        <button type="submit" className="fc-btn fc-btn-primary" disabled={status === "loading"}>
          {status === "loading" ? t(locale, "forecast.analyzingText") : t(locale, "forecast.submitButton")}
        </button>
      </form>

      {status === "error" && errorMessage && (
        <p style={{ color: "var(--fc-band-high)", marginTop: "1rem" }}>{errorMessage}</p>
      )}

      {status === "done" && result && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
            <DownloadPdfButton buildReportData={buildReportData} locale={locale} />
          </div>

          <div>
          {scenarioStatus === "done" && scenarios.length > 0 && mostLikely && (
            <ExecutiveSummary
              locale={locale}
              topScenarioTitle={mostLikely.title}
              mainRecommendation={mostLikely.recommendedResponse ?? ""}
              realityCheckBadgeLabel={realityCheckBadgeLabel}
            />
          )}

          <RealityCheckBarometer
            locale={locale}
            factsCount={factsCount}
            assumptionsCount={assumptionsCount}
            unknownsCount={unknownsCount}
          />

          <SectionList locale={locale} headingKey="forecast.factsHeading" items={byKind("fact")} />
          <SectionList locale={locale} headingKey="forecast.assumptionsHeading" items={byKind("assumption")} />
          <SectionList locale={locale} headingKey="forecast.unknownsHeading" items={byKind("unknown")} />
          {result.followUpQuestions.length > 0 && (
            <SectionList locale={locale} headingKey="forecast.followUpHeading" items={result.followUpQuestions} />
          )}

          <section style={{ marginBottom: "1.75rem" }}>
            <details>
              <summary style={{ cursor: "pointer", color: "var(--fc-accent)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                {t(locale, "update.button")}
              </summary>
              <form onSubmit={handleUpdateForecast} style={{ marginTop: "0.75rem" }}>
                <label htmlFor="additionalInfo" className="fc-label">{t(locale, "update.label")}</label>
                <textarea
                  id="additionalInfo"
                  className="fc-textarea"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder={t(locale, "update.placeholder")}
                  rows={3}
                  style={{ marginBottom: "0.75rem", resize: "vertical" }}
                />
                <button type="submit" className="fc-btn fc-btn-secondary" disabled={updateStatus === "loading"}>
                  {updateStatus === "loading" ? t(locale, "update.recalculatingText") : t(locale, "update.submitButton")}
                </button>
                {updateStatus === "error" && (
                  <p style={{ color: "var(--fc-band-high)", marginTop: "0.5rem" }}>{t(locale, "errors.generic")}</p>
                )}
              </form>
            </details>
            {forecastDiff && !isDiffEmpty(forecastDiff) && (
              <div className="fc-strip" style={{ marginTop: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--fc-text-secondary)" }}>
                  {locale === "ar" ? "ما الذي تغيّر" : "What changed"}
                </p>
                {[
                  { items: forecastDiff.addedFacts, label: locale === "ar" ? "حقائق جديدة" : "New facts", sign: "+" },
                  { items: forecastDiff.removedAssumptions, label: locale === "ar" ? "افتراضات اترفعت" : "Assumptions resolved", sign: "−" },
                  { items: forecastDiff.removedUnknowns, label: locale === "ar" ? "مجاهيل اتوضحت" : "Unknowns clarified", sign: "−" },
                  { items: forecastDiff.addedAssumptions, label: locale === "ar" ? "افتراضات جديدة" : "New assumptions", sign: "+" },
                  { items: forecastDiff.addedUnknowns, label: locale === "ar" ? "مجاهيل جديدة" : "New unknowns", sign: "+" },
                ]
                  .filter((g) => g.items.length > 0)
                  .map((g) => (
                    <div key={g.label} style={{ marginBottom: "0.5rem" }}>
                      <p style={{ margin: "0 0 0.2rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>{g.label}</p>
                      <ul style={{ margin: 0, paddingInlineStart: "1.2rem", fontSize: "0.88rem" }}>
                        {g.items.map((item, i) => (
                          <li key={i}>
                            {g.sign} {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section style={{ marginTop: "2rem", marginBottom: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{t(locale, "decision.heading")}</h2>
            <form onSubmit={handleAnalyzeDecision}>
              <label htmlFor="options" className="fc-label">{t(locale, "decision.optionsLabel")}</label>
              <input
                id="options"
                type="text"
                className="fc-input"
                value={decisionOptionsInput}
                onChange={(e) => setDecisionOptionsInput(e.target.value)}
                placeholder={t(locale, "decision.optionsPlaceholder")}
                style={{ marginBottom: "0.85rem" }}
              />
              <button type="submit" className="fc-btn fc-btn-secondary" disabled={decisionStatus === "loading"}>
                {decisionStatus === "loading" ? t(locale, "decision.analyzingText") : t(locale, "decision.submitButton")}
              </button>
            </form>
            {decisionStatus === "error" && (
              <p style={{ color: "var(--fc-band-high)", marginTop: "0.75rem" }}>{t(locale, "errors.generic")}</p>
            )}
            {decisionStatus === "done" && decisionResult && (
              <div style={{ marginTop: "1.25rem" }}>
                {decisionResult.options.map((opt, i) => (
                  <DecisionOptionCard key={i} locale={locale} opt={opt} />
                ))}
                <SectionList locale={locale} headingKey="decision.keyVariables" items={decisionResult.keyVariables} />
                <p style={{ fontSize: "0.92rem", margin: "0 0 0.5rem" }}>
                  <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "decision.recommendation")}:</strong> {decisionResult.recommendation}
                </p>
                <p style={{ fontSize: "0.92rem", margin: 0 }}>
                  <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "forecast.contingencyPlan")}:</strong> {decisionResult.contingencyPlan}
                </p>
              </div>
            )}
          </section>

          {scenariosStale && scenarioStatus !== "loading" && (
            <p style={{ color: "var(--fc-band-moderate)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {t(locale, "update.staleScenarios")}
            </p>
          )}

          {(scenarioStatus !== "done" || scenariosStale) && (
            <button type="button" className="fc-btn fc-btn-primary" onClick={handleGenerateScenarios} disabled={scenarioStatus === "loading"}>
              {scenarioStatus === "loading" ? t(locale, "forecast.generatingScenariosText") : t(locale, "forecast.generateScenariosButton")}
            </button>
          )}

          {scenarioStatus === "error" && (
            <p style={{ color: "var(--fc-band-high)", marginTop: "0.75rem" }}>{scenarioErrorMessage ?? t(locale, "errors.generic")}</p>
          )}

          {scenarioStatus === "done" && scenarios.length > 0 && !scenariosStale && (
            <section style={{ marginTop: "1.75rem" }}>
              <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{t(locale, "forecast.scenariosHeading")}</h2>
              <ScenarioAccordion locale={locale} scenarios={scenarios} />

              {recommendedAction && (
                <div
                  className="fc-strip"
                  style={{ ["--fc-strip-color" as string]: "var(--fc-accent)", marginTop: "1.25rem", marginBottom: "1.25rem" }}
                >
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--fc-accent)" }}>
                    {locale === "ar" ? "ماذا أفعل الآن؟" : "What should I do now?"}
                  </p>
                  <p style={{ margin: recommendedAction.conditionalBranches.length > 0 ? "0 0 0.75rem" : 0, fontSize: "0.95rem" }}>
                    {recommendedAction.summary}
                  </p>
                  {recommendedAction.conditionalBranches.length > 0 && (
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      {recommendedAction.conditionalBranches.map((b, i) => (
                        <p key={i} style={{ margin: 0, fontSize: "0.88rem" }}>
                          <strong>{b.condition}</strong> → {b.action}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {whatCouldChangeForecast.length > 0 && (
                <section style={{ marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "0.95rem", fontFamily: "var(--fc-font-sans)", fontWeight: 600, color: "var(--fc-text-secondary)", margin: "0 0 0.5rem" }}>
                    {locale === "ar" ? "ما الذي قد يغيّر هذا التوقع" : "What could change this forecast"}
                  </h2>
                  <ul style={{ margin: 0, paddingInlineStart: "1.2rem" }}>
                    {whatCouldChangeForecast.map((item, i) => (
                      <li key={i} style={{ marginBottom: "0.3rem", lineHeight: 1.5 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {limitsOfForecast && (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--fc-text-muted)",
                    fontStyle: "italic",
                    borderInlineStart: "2px solid var(--fc-border-strong)",
                    paddingInlineStart: "0.75rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  {locale === "ar" ? "ما لا يستطيع هذا التوقع تحديده: " : "What this forecast can't determine: "}
                  {limitsOfForecast}
                </p>
              )}

              {outcomeStatus !== "done" && (
                <form onSubmit={handleRecordOutcome} style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
                  <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{t(locale, "outcome.heading")}</h2>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    {[
                      { key: "better", label: t(locale, "outcome.betterThanExpected") },
                      { key: "expected", label: t(locale, "outcome.asExpected") },
                      { key: "worse", label: t(locale, "outcome.worseThanExpected") },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setResultTag(opt.key)}
                        className="fc-btn"
                        style={{
                          padding: "0.4rem 0.75rem",
                          fontSize: "0.8rem",
                          background: resultTag === opt.key ? "var(--fc-accent-soft)" : "transparent",
                          border: `1px solid ${resultTag === opt.key ? "var(--fc-accent)" : "var(--fc-border-strong)"}`,
                          color: resultTag === opt.key ? "var(--fc-accent)" : "var(--fc-text-primary)",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <label htmlFor="outcome" className="fc-label">{t(locale, "outcome.label")}</label>
                  <textarea
                    id="outcome"
                    className="fc-textarea"
                    value={actualOutcome}
                    onChange={(e) => setActualOutcome(e.target.value)}
                    placeholder={t(locale, "outcome.placeholder")}
                    rows={3}
                    style={{ marginBottom: "1rem", resize: "vertical" }}
                  />

                  <label htmlFor="reminder" className="fc-label">{t(locale, "outcome.reminderLabel")}</label>
                  <select
                    id="reminder"
                    className="fc-input"
                    value={reminderInterval}
                    onChange={(e) => handleSetReminder(e.target.value)}
                    style={{ width: "auto", marginBottom: "0.4rem" }}
                  >
                    <option value="">{t(locale, "outcome.reminderNone")}</option>
                    <option value="24h">{t(locale, "outcome.reminder24h")}</option>
                    <option value="3d">{t(locale, "outcome.reminder3d")}</option>
                    <option value="1w">{t(locale, "outcome.reminder1w")}</option>
                  </select>
                  <p style={{ fontSize: "0.72rem", color: "var(--fc-text-muted)", margin: "0 0 1rem" }}>
                    {t(locale, "outcome.reminderNote")}
                  </p>

                  <button type="submit" className="fc-btn fc-btn-primary" disabled={outcomeStatus === "loading"}>
                    {outcomeStatus === "loading" ? t(locale, "outcome.recordingText") : t(locale, "outcome.submitButton")}
                  </button>
                  {outcomeStatus === "error" && (
                    <p style={{ color: "var(--fc-band-high)", marginTop: "0.75rem" }}>{t(locale, "errors.generic")}</p>
                  )}
                </form>
              )}

              {outcomeStatus === "done" && outcomeResult && (
                <section style={{ marginTop: "1.5rem" }}>
                  <p style={{ fontSize: "0.92rem" }}>
                    <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "outcome.matchedScenario")}:</strong>{" "}
                    {outcomeResult.matchedScenarioTitle ?? t(locale, "outcome.noMatch")}
                  </p>
                  <SectionList locale={locale} headingKey="outcome.whatWentRight" items={outcomeResult.outcomeRecord.whatWentRight} />
                  <SectionList locale={locale} headingKey="outcome.whatWasMissed" items={outcomeResult.outcomeRecord.whatWasMissed} />
                  <SectionList locale={locale} headingKey="outcome.wrongAssumptions" items={outcomeResult.outcomeRecord.wrongAssumptions} />
                </section>
              )}
            </section>
          )}
          </div>
        </div>
      )}
    </main>
  );
}
