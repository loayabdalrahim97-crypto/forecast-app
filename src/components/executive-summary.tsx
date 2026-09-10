"use client";

export function ExecutiveSummary({
  locale,
  topScenarioTitle,
  mainRecommendation,
  realityCheckBadgeLabel,
}: {
  locale: string;
  topScenarioTitle: string;
  mainRecommendation: string;
  realityCheckBadgeLabel: string;
}) {
  const isRtl = locale === "ar";
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--fc-bg-base)",
        borderBottom: "1px solid var(--fc-border)",
        padding: "0.85rem 0",
        marginBottom: "1.5rem",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
        {isRtl ? "الملخص التنفيذي" : "Executive Summary"}
      </p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", lineHeight: 1.5 }}>
        <strong>{topScenarioTitle}</strong>
        {" — "}
        {mainRecommendation}
        {"  ·  "}
        <span style={{ color: "var(--fc-text-secondary)" }}>{realityCheckBadgeLabel}</span>
      </p>
    </div>
  );
}
