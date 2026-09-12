"use client";

import { useState } from "react";
import { BandGauge } from "@/components/band-gauge";
import { CopyButton } from "@/components/copy-button";

export interface AccordionScenario {
  id: string;
  outcomeType: string | null;
  pathLabel?: string | null;
  title: string;
  description: string;
  likelihood: string;
  confidence: string;
  impact: string;
  evidence: unknown;
  assumptions: unknown;
  triggers: unknown;
  earlyWarningSigns: unknown;
  likelihoodIncreasesIf: unknown;
  likelihoodDecreasesIf: unknown;
  likelyUserResponse: string | null;
  recommendedResponse: string | null;
  contingencyPlan: string | null;
}

const ORDER = ["best_case", "most_likely", "worst_case", "positive", "mixed", "negative"];

const HEADING: Record<string, { en: string; ar: string }> = {
  best_case: { en: "Best Case / Constructive Outcome", ar: "أفضل احتمال / نتيجة إيجابية" },
  most_likely: { en: "Most Likely / Standard Outcome", ar: "الاحتمال الأرجح / النتيجة المتوقعة" },
  worst_case: { en: "Worst Case / Challenging Outcome", ar: "أسوأ احتمال / نتيجة صعبة" },
  // Decision Paths mode — one set of these per named alternative,
  // rather than a single best/likely/worst across the whole situation.
  positive: { en: "If This Goes Well", ar: "لو سار هذا بشكل جيد" },
  mixed: { en: "Mixed Outcome", ar: "نتيجة مختلطة" },
  negative: { en: "If This Goes Poorly", ar: "لو سار هذا بشكل سيئ" },
};

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function ScenarioAccordionItem({
  locale,
  scenario,
  defaultOpen,
}: {
  locale: string;
  scenario: AccordionScenario;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showReasoning, setShowReasoning] = useState(false);
  const isRtl = locale === "ar";
  const outcomeType = scenario.outcomeType ?? "most_likely";
  const heading = isRtl ? HEADING[outcomeType]?.ar : HEADING[outcomeType]?.en;
  const stripColor =
    outcomeType === "best_case" || outcomeType === "positive"
      ? "var(--fc-positive)"
      : outcomeType === "worst_case" || outcomeType === "negative"
        ? "var(--fc-band-high)"
        : "var(--fc-band-moderate)";

  return (
    <div
      className="fc-strip"
      style={{ ["--fc-strip-color" as string]: stripColor, marginBottom: "0.85rem", padding: 0, overflow: "hidden" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: isRtl ? "right" : "left",
          padding: "1rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <p style={{ margin: "0 0 0.2rem", fontSize: "0.75rem", color: "var(--fc-text-muted)" }}>
            {heading}
          </p>
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{scenario.title}</h3>
        </div>
        <span style={{ fontSize: "1.1rem", color: "var(--fc-text-muted)" }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
            <BandGauge label={isRtl ? "التأثير" : "Impact"} value={scenario.impact} />
            <BandGauge label={isRtl ? "الثقة" : "Confidence"} value={scenario.confidence} />
          </div>

          <p style={{ color: "var(--fc-text-secondary)", lineHeight: 1.55, fontSize: "0.92rem", margin: "0 0 1rem" }}>
            {scenario.description}
          </p>

          {scenario.recommendedResponse && (
            <div
              style={{
                background: "var(--fc-bg-elevated)",
                borderRadius: "var(--fc-radius-sm)",
                padding: "0.85rem",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div>
                  <p style={{ margin: "0 0 0.3rem", fontSize: "0.75rem", color: "var(--fc-text-muted)" }}>
                    {isRtl ? "الاستجابة الموصى بها" : "Recommended Response"}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>{scenario.recommendedResponse}</p>
                </div>
                <CopyButton text={scenario.recommendedResponse} locale={locale} />
              </div>
            </div>
          )}

          {scenario.contingencyPlan && (
            <div
              style={{
                background: "var(--fc-bg-elevated)",
                borderRadius: "var(--fc-radius-sm)",
                padding: "0.85rem",
                marginBottom: "0.9rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div>
                  <p style={{ margin: "0 0 0.3rem", fontSize: "0.75rem", color: "var(--fc-text-muted)" }}>
                    {isRtl ? "خطة الطوارئ" : "Contingency Plan"}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>{scenario.contingencyPlan}</p>
                </div>
                <CopyButton text={scenario.contingencyPlan} locale={locale} />
              </div>
            </div>
          )}

          <button
            type="button"
            className="fc-btn fc-btn-secondary"
            style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
            onClick={() => setShowReasoning((s) => !s)}
          >
            {showReasoning
              ? isRtl
                ? "إخفاء التفاصيل"
                : "Hide Reasoning & Triggers"
              : isRtl
                ? "عرض التفاصيل والمحفزات"
                : "Show Reasoning & Triggers"}
          </button>

          {showReasoning && (
            <div style={{ marginTop: "0.9rem", fontSize: "0.85rem", display: "grid", gap: "0.6rem" }}>
              {[
                { key: "evidence", label: isRtl ? "الأدلة" : "Evidence" },
                { key: "assumptions", label: isRtl ? "الافتراضات" : "Assumptions" },
                { key: "triggers", label: isRtl ? "المحفزات" : "Triggers" },
                { key: "earlyWarningSigns", label: isRtl ? "إشارات إنذار مبكر" : "Early Warning Signs" },
                { key: "likelihoodIncreasesIf", label: isRtl ? "الاحتمالية بتزيد لو" : "Likelihood increases if" },
                { key: "likelihoodDecreasesIf", label: isRtl ? "الاحتمالية بتقل لو" : "Likelihood decreases if" },
              ].map(({ key, label }) => {
                const items = asStringList((scenario as unknown as Record<string, unknown>)[key]);
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <p style={{ margin: "0 0 0.25rem", color: "var(--fc-text-muted)", fontSize: "0.78rem" }}>
                      {label}
                    </p>
                    <ul style={{ margin: 0, paddingInlineStart: "1.1rem" }}>
                      {items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {scenario.likelyUserResponse && (
                <div>
                  <p style={{ margin: "0 0 0.25rem", color: "var(--fc-text-muted)", fontSize: "0.78rem" }}>
                    {isRtl ? "استجابتك المتوقعة" : "Likely User Response"}
                  </p>
                  <p style={{ margin: 0 }}>{scenario.likelyUserResponse}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ScenarioAccordion({ locale, scenarios }: { locale: string; scenarios: AccordionScenario[] }) {
  const isRtl = locale === "ar";
  const hasPaths = scenarios.some((s) => s.pathLabel);

  if (!hasPaths) {
    const sorted = [...scenarios].sort(
      (a, b) => ORDER.indexOf(a.outcomeType ?? "most_likely") - ORDER.indexOf(b.outcomeType ?? "most_likely")
    );
    return (
      <div>
        {sorted.map((s) => (
          <ScenarioAccordionItem
            key={s.id}
            locale={locale}
            scenario={s}
            defaultOpen={s.outcomeType !== "worst_case" && s.outcomeType !== "negative"}
          />
        ))}
      </div>
    );
  }

  // Decision Paths mode: group scenarios by their named alternative so
  // it's visually unmistakable that these are two (or more) different
  // choices being modeled, not one combined set of outcomes.
  const groups = new Map<string, AccordionScenario[]>();
  for (const s of scenarios) {
    const key = s.pathLabel ?? "";
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }

  return (
    <div>
      {Array.from(groups.entries()).map(([pathLabel, group]) => {
        const sorted = [...group].sort(
          (a, b) => ORDER.indexOf(a.outcomeType ?? "mixed") - ORDER.indexOf(b.outcomeType ?? "mixed")
        );
        return (
          <div key={pathLabel} style={{ marginBottom: "1.75rem" }}>
            <h3
              style={{
                fontSize: "1rem",
                margin: "0 0 0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--fc-border)",
                textAlign: isRtl ? "right" : "left",
              }}
            >
              {isRtl ? "المسار: " : "Path: "}
              {pathLabel}
            </h3>
            {sorted.map((s) => (
              <ScenarioAccordionItem
                key={s.id}
                locale={locale}
                scenario={s}
                defaultOpen={s.outcomeType !== "negative"}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
