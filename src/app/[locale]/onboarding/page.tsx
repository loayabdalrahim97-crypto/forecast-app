"use client";

import { useMemo, useState } from "react";
import { BEHAVIORAL_PROFILE_QUESTIONS } from "@/lib/behavioral-profile/questions";
import enUs from "../../../../messages/en-us.json";
import ar from "../../../../messages/ar.json";

// Minimal message lookup for Phase 2 — a real i18n library (next-intl)
// wires this up properly in a later pass; this keeps onboarding
// functional without blocking on that integration (§4 still respected:
// no hard-coded strings, everything comes from messages/*.json).
const MESSAGES: Record<string, typeof enUs> = { "en-us": enUs, ar };

function t(locale: string, path: string, vars?: Record<string, string | number>): string {
  const dict = MESSAGES[locale] ?? enUs;
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  let str = typeof value === "string" ? value : path;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

type Answers = Record<string, string>;

export default function OnboardingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const questions = BEHAVIORAL_PROFILE_QUESTIONS;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [status, setStatus] = useState<"in_progress" | "submitting" | "done" | "error">(
    "in_progress"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const current = questions[step];
  const isLast = step === questions.length - 1;

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  async function submit(finalAnswers: Answers) {
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/behavioral-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(finalAnswers).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        }),
      });

      if (res.status === 401) {
        setErrorMessage(t(locale, "errors.notAuthenticated"));
        setStatus("error");
        return;
      }
      if (!res.ok) {
        setErrorMessage(t(locale, "errors.generic"));
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMessage(t(locale, "errors.generic"));
      setStatus("error");
    }
  }

  function selectOption(value: string) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);

    if (isLast) {
      submit(next);
    } else {
      setStep((s) => s + 1);
    }
  }

  if (status === "done") {
    return (
      <main style={{ padding: "2rem", maxWidth: 480 }}>
        <h1>{t(locale, "onboarding.completeTitle")}</h1>
        <p>{t(locale, "onboarding.completeBody")}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 480 }}>
      <h1>{t(locale, "onboarding.title")}</h1>
      <p style={{ color: "var(--fc-text-secondary)" }}>{t(locale, "onboarding.intro")}</p>

      <p style={{ fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
        {t(locale, "onboarding.progress", {
          current: answeredCount + 1,
          total: questions.length,
        })}
      </p>

      <fieldset style={{ border: "none", padding: 0, margin: "1.5rem 0" }}>
        <legend style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
          {t(locale, current.promptKey)}
        </legend>

        {current.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => selectOption(opt.value)}
            disabled={status === "submitting"}
            style={{
              display: "block",
              width: "100%",
              textAlign: locale === "ar" ? "right" : "left",
              padding: "0.75rem 1rem",
              marginBottom: "0.5rem",
              borderRadius: "var(--fc-radius-md)",
              border: "1px solid var(--fc-border)",
              background: "var(--fc-bg-card)",
              color: "var(--fc-text-primary)",
              cursor: "pointer",
            }}
          >
            {t(locale, opt.labelKey)}
          </button>
        ))}
      </fieldset>

      {step > 0 && status === "in_progress" && (
        <button type="button" onClick={() => setStep((s) => s - 1)}>
          {t(locale, "onboarding.backButton")}
        </button>
      )}

      {status === "error" && errorMessage && (
        <p style={{ color: "var(--fc-band-high)" }}>{errorMessage}</p>
      )}
    </main>
  );
}
