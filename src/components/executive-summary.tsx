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
      className="fc-strip"
      style={{
        ["--fc-strip-color" as string]: "var(--fc-accent)",
        marginBottom: "1.5rem",
        padding: "1.1rem 1.25rem",
      }}
    >
      <p style={{ margin: "0 0 0.4rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--fc-accent)" }}>
        {isRtl ? "ماذا أفعل الآن؟" : "What should I do now?"}
      </p>
      <p style={{ margin: "0 0 0.6rem", fontSize: "1.1rem", lineHeight: 1.5, fontWeight: 600 }}>
        {mainRecommendation}
      </p>
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--fc-text-muted)" }}>
        {isRtl ? "بناءً على" : "Based on"}: <strong style={{ color: "var(--fc-text-secondary)" }}>{topScenarioTitle}</strong>
        {"  ·  "}
        {realityCheckBadgeLabel}
      </p>
    </div>
  );
}
