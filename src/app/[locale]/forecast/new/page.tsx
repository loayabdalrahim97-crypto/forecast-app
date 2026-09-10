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

function section(locale: string, headingKey: string, items: string[]) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontSize: "1rem", color: "var(--fc-text-secondary)" }}>
        {t(locale, headingKey)}
      </h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function ScenarioCard({ locale, scenario }: { locale: string; scenario: Scenario }) {
  return (
    <div
      style={{
        border: "1px solid var(--fc-border)",
        borderRadius: "var(--fc-radius-md)",
        background: "var(--fc-bg-card)",
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{scenario.title}</h3>
      <p style={{ color: "var(--fc-text-secondary)" }}>{scenario.description}</p>
      <p style={{ fontSize: "0.85rem" }}>
        {t(locale, "forecast.likelihood")}: <strong>{scenario.likelihood}</strong>
        {"  ·  "}
        {t(locale, "forecast.confidence")}: <strong>{scenario.confidence}</strong>
        {"  ·  "}
        {t(locale, "forecast.impact")}: <strong>{scenario.impact}</strong>
      </p>
      {scenario.recommendedResponse && (
        <p>
          <strong>{t(locale, "forecast.recommendedResponse")}:</strong>{" "}
          {scenario.recommendedResponse}
        </p>
      )}
      {scenario.contingencyPlan && (
        <p>
          <strong>{t(locale, "forecast.contingencyPlan")}:</strong> {scenario.contingencyPlan}
        </p>
      )}
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
        setErrorMessage(t(locale, "errors.generic"));
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
    <main style={{ padding: "2rem", maxWidth: 560 }}>
      <h1>FORECAST</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="situation" style={{ display: "block", marginBottom: "0.5rem" }}>
          {t(locale, "forecast.situationLabel")}
        </label>
        <textarea
          id="situation"
          value={situationText}
          onChange={(e) => setSituationText(e.target.value)}
          placeholder={t(locale, "forecast.situationPlaceholder")}
          rows={5}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--fc-radius-md)",
            border: "1px solid var(--fc-border)",
            background: "var(--fc-bg-card)",
            color: "var(--fc-text-primary)",
            marginBottom: "1rem",
          }}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? t(locale, "forecast.analyzingText") : t(locale, "forecast.submitButton")}
        </button>
      </form>

      {status === "error" && errorMessage && (
        <p style={{ color: "var(--fc-band-high)", marginTop: "1rem" }}>{errorMessage}</p>
      )}

      {status === "done" && result && (
        <div style={{ marginTop: "2rem" }}>
          {section(locale, "forecast.factsHeading", byKind("fact"))}
          {section(locale, "forecast.assumptionsHeading", byKind("assumption"))}
          {section(locale, "forecast.unknownsHeading", byKind("unknown"))}
          {result.followUpQuestions.length > 0 &&
            section(locale, "forecast.followUpHeading", result.followUpQuestions)}

          {scenarioStatus !== "done" && (
            <button type="button" onClick={handleGenerateScenarios} disabled={scenarioStatus === "loading"}>
              {scenarioStatus === "loading"
                ? t(locale, "forecast.generatingScenariosText")
                : t(locale, "forecast.generateScenariosButton")}
            </button>
          )}

          {scenarioStatus === "error" && (
            <p style={{ color: "var(--fc-band-high)" }}>{t(locale, "errors.generic")}</p>
          )}

          {scenarioStatus === "done" && scenarios.length > 0 && (
            <section style={{ marginTop: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", color: "var(--fc-text-secondary)" }}>
                {t(locale, "forecast.scenariosHeading")}
              </h2>
              {scenarios.map((s) => (
                <ScenarioCard key={s.id} locale={locale} scenario={s} />
              ))}

              {outcomeStatus !== "done" && (
                <form onSubmit={handleRecordOutcome} style={{ marginTop: "1.5rem" }}>
                  <h2 style={{ fontSize: "1rem", color: "var(--fc-text-secondary)" }}>
                    {t(locale, "outcome.heading")}
                  </h2>
                  <label htmlFor="outcome" style={{ display: "block", marginBottom: "0.5rem" }}>
                    {t(locale, "outcome.label")}
                  </label>
                  <textarea
                    id="outcome"
                    value={actualOutcome}
                    onChange={(e) => setActualOutcome(e.target.value)}
                    placeholder={t(locale, "outcome.placeholder")}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "var(--fc-radius-md)",
                      border: "1px solid var(--fc-border)",
                      background: "var(--fc-bg-card)",
                      color: "var(--fc-text-primary)",
                      marginBottom: "1rem",
                    }}
                  />
                  <button type="submit" disabled={outcomeStatus === "loading"}>
                    {outcomeStatus === "loading"
                      ? t(locale, "outcome.recordingText")
                      : t(locale, "outcome.submitButton")}
                  </button>
                  {outcomeStatus === "error" && (
                    <p style={{ color: "var(--fc-band-high)" }}>{t(locale, "errors.generic")}</p>
                  )}
                </form>
              )}

              {outcomeStatus === "done" && outcomeResult && (
                <section style={{ marginTop: "1.5rem" }}>
                  <p>
                    <strong>{t(locale, "outcome.matchedScenario")}:</strong>{" "}
                    {outcomeResult.matchedScenarioTitle ?? t(locale, "outcome.noMatch")}
                  </p>
                  {section(
                    locale,
                    "outcome.whatWentRight",
                    outcomeResult.outcomeRecord.whatWentRight
                  )}
                  {section(
                    locale,
                    "outcome.whatWasMissed",
                    outcomeResult.outcomeRecord.whatWasMissed
                  )}
                  {section(
                    locale,
                    "outcome.wrongAssumptions",
                    outcomeResult.outcomeRecord.wrongAssumptions
                  )}
                </section>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
