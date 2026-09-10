"use client";

import { useState } from "react";
import enUs from "../../../../../messages/en-us.json";
import ar from "../../../../../messages/ar.json";

const MESSAGES: Record<string, typeof enUs> = { "en-us": enUs, ar };

function t(locale: string, path: string): string {
  const dict = MESSAGES[locale] ?? enUs;
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : path;
}

type Band = "low" | "moderate" | "high";

function normalizeBand(value: string): Band {
  const v = value.toLowerCase();
  if (v === "low" || v === "moderate" || v === "high") return v;
  return "moderate";
}

function BandPill({ locale, labelKey, value }: { locale: string; labelKey: string; value: string }) {
  const band = normalizeBand(value);
  return (
    <span
      className="fc-pill"
      style={{ color: `var(--fc-band-${band})`, background: `var(--fc-band-${band}-soft)` }}
    >
      {t(locale, labelKey)}: {value}
    </span>
  );
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

interface Scenario {
  id: string;
  title: string;
  description: string;
  likelihood: string;
  confidence: string;
  impact: string;
  likelyUserResponse: string | null;
  recommendedResponse: string | null;
  contingencyPlan: string | null;
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

function ScenarioCard({ locale, scenario }: { locale: string; scenario: Scenario }) {
  return (
    <div
      className="fc-strip"
      style={{ ["--fc-strip-color" as string]: `var(--fc-band-${normalizeBand(scenario.impact)})`, marginBottom: "1rem" }}
    >
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem" }}>{scenario.title}</h3>
      <p style={{ color: "var(--fc-text-secondary)", lineHeight: 1.55, margin: "0 0 0.75rem" }}>
        {scenario.description}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <BandPill locale={locale} labelKey="forecast.likelihood" value={scenario.likelihood} />
        <BandPill locale={locale} labelKey="forecast.confidence" value={scenario.confidence} />
        <BandPill locale={locale} labelKey="forecast.impact" value={scenario.impact} />
      </div>
      {scenario.recommendedResponse && (
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.92rem" }}>
          <strong style={{ color: "var(--fc-text-secondary)", fontWeight: 600 }}>
            {t(locale, "forecast.recommendedResponse")}:
          </strong>{" "}
          {scenario.recommendedResponse}
        </p>
      )}
      {scenario.contingencyPlan && (
        <p style={{ margin: 0, fontSize: "0.92rem" }}>
          <strong style={{ color: "var(--fc-text-secondary)", fontWeight: 600 }}>
            {t(locale, "forecast.contingencyPlan")}:
          </strong>{" "}
          {scenario.contingencyPlan}
        </p>
      )}
    </div>
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
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>{opt.option}</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <BandPill locale={locale} labelKey="decision.risk" value={opt.risk} />
        <BandPill locale={locale} labelKey="decision.reversibility" value={opt.reversibility} />
      </div>
      <SectionList locale={locale} headingKey="decision.upside" items={opt.upside} />
      <SectionList locale={locale} headingKey="decision.downside" items={opt.downside} />
      <p style={{ margin: "0 0 0.35rem", fontSize: "0.9rem" }}>
        <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "decision.bestCase")}:</strong> {opt.bestCase}
      </p>
      <p style={{ margin: "0 0 0.35rem", fontSize: "0.9rem" }}>
        <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "decision.baseCase")}:</strong> {opt.baseCase}
      </p>
      <p style={{ margin: 0, fontSize: "0.9rem" }}>
        <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "decision.worstCase")}:</strong> {opt.worstCase}
      </p>
    </div>
  );
}

export default function NewForecastPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [situationText, setSituationText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [scenarioStatus, setScenarioStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [actualOutcome, setActualOutcome] = useState("");
  const [outcomeStatus, setOutcomeStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [outcomeResult, setOutcomeResult] = useState<{
    matchedScenarioTitle: string | null;
    outcomeRecord: {
      whatWentRight: string[];
      whatWasMissed: string[];
      wrongAssumptions: string[];
    };
  } | null>(null);

  const [decisionOptionsInput, setDecisionOptionsInput] = useState("");
  const [decisionStatus, setDecisionStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [decisionResult, setDecisionResult] = useState<DecisionAnalysisResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!situationText.trim()) return;

    setStatus("loading");
    setErrorMessage(null);
    setScenarios([]);
    setScenarioStatus("idle");
    try {
      const res = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situationText, locale }),
      });
      if (!res.ok) {
        setErrorMessage(
          res.status === 429 ? t(locale, "errors.rateLimited") : t(locale, "errors.generic")
        );
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
    try {
      const res = await fetch(`/api/forecasts/${result.forecast.id}/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        setScenarioStatus("error");
        return;
      }
      const data = (await res.json()) as { scenarios: Scenario[] };
      setScenarios(data.scenarios);
      setScenarioStatus("done");
    } catch {
      setScenarioStatus("error");
    }
  }

  const byKind = (kind: string) =>
    result?.forecast.variables.filter((v) => v.kind === kind).map((v) => v.content) ?? [];

  async function handleAnalyzeDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;

    setDecisionStatus("loading");
    try {
      const options = decisionOptionsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
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
        body: JSON.stringify({ actualOutcome, locale }),
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

  return (
    <main style={{ padding: "2.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", margin: "0 0 1.5rem" }}>FORECAST</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="situation" className="fc-label">
          {t(locale, "forecast.situationLabel")}
        </label>
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
        <div style={{ marginTop: "2.25rem" }}>
          <SectionList locale={locale} headingKey="forecast.factsHeading" items={byKind("fact")} />
          <SectionList locale={locale} headingKey="forecast.assumptionsHeading" items={byKind("assumption")} />
          <SectionList locale={locale} headingKey="forecast.unknownsHeading" items={byKind("unknown")} />
          {result.followUpQuestions.length > 0 && (
            <SectionList locale={locale} headingKey="forecast.followUpHeading" items={result.followUpQuestions} />
          )}

          <section style={{ marginTop: "2rem", marginBottom: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{t(locale, "decision.heading")}</h2>
            <form onSubmit={handleAnalyzeDecision}>
              <label htmlFor="options" className="fc-label">
                {t(locale, "decision.optionsLabel")}
              </label>
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
                {decisionStatus === "loading"
                  ? t(locale, "decision.analyzingText")
                  : t(locale, "decision.submitButton")}
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
                  <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "decision.recommendation")}:</strong>{" "}
                  {decisionResult.recommendation}
                </p>
                <p style={{ fontSize: "0.92rem", margin: 0 }}>
                  <strong style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "forecast.contingencyPlan")}:</strong>{" "}
                  {decisionResult.contingencyPlan}
                </p>
              </div>
            )}
          </section>

          {scenarioStatus !== "done" && (
            <button
              type="button"
              className="fc-btn fc-btn-primary"
              onClick={handleGenerateScenarios}
              disabled={scenarioStatus === "loading"}
            >
              {scenarioStatus === "loading"
                ? t(locale, "forecast.generatingScenariosText")
                : t(locale, "forecast.generateScenariosButton")}
            </button>
          )}

          {scenarioStatus === "error" && (
            <p style={{ color: "var(--fc-band-high)", marginTop: "0.75rem" }}>{t(locale, "errors.generic")}</p>
          )}

          {scenarioStatus === "done" && scenarios.length > 0 && (
            <section style={{ marginTop: "1.75rem" }}>
              <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{t(locale, "forecast.scenariosHeading")}</h2>
              {scenarios.map((s) => (
                <ScenarioCard key={s.id} locale={locale} scenario={s} />
              ))}

              {outcomeStatus !== "done" && (
                <form
                  onSubmit={handleRecordOutcome}
                  style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}
                >
                  <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>{t(locale, "outcome.heading")}</h2>
                  <label htmlFor="outcome" className="fc-label">
                    {t(locale, "outcome.label")}
                  </label>
                  <textarea
                    id="outcome"
                    className="fc-textarea"
                    value={actualOutcome}
                    onChange={(e) => setActualOutcome(e.target.value)}
                    placeholder={t(locale, "outcome.placeholder")}
                    rows={3}
                    style={{ marginBottom: "1rem", resize: "vertical" }}
                  />
                  <button type="submit" className="fc-btn fc-btn-primary" disabled={outcomeStatus === "loading"}>
                    {outcomeStatus === "loading"
                      ? t(locale, "outcome.recordingText")
                      : t(locale, "outcome.submitButton")}
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
      )}
    </main>
  );
}
