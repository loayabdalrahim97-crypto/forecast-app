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

export default function NewForecastPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [situationText, setSituationText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!situationText.trim()) return;

    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situationText }),
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

  const byKind = (kind: string) =>
    result?.forecast.variables.filter((v) => v.kind === kind).map((v) => v.content) ?? [];

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
        </div>
      )}
    </main>
  );
}
