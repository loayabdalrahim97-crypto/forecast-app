"use client";

import { computeRealityCheck, type RealityCheckBadge } from "@/lib/forecast/reality-check";

const BADGE_STYLE: Record<RealityCheckBadge, { color: string; bg: string }> = {
  grounded: { color: "var(--fc-band-low)", bg: "var(--fc-band-low-soft)" },
  high_assumption: { color: "var(--fc-band-moderate)", bg: "var(--fc-band-moderate-soft)" },
  mixed: { color: "var(--fc-text-secondary)", bg: "var(--fc-bg-elevated)" },
};

const BADGE_LABEL: Record<RealityCheckBadge, { en: string; ar: string }> = {
  grounded: { en: "Grounded in Real Data", ar: "مبني على بيانات حقيقية" },
  high_assumption: { en: "High Assumption Reliance", ar: "اعتماد كبير على الافتراضات" },
  mixed: { en: "Mixed Evidence", ar: "أدلة متوازنة" },
};

export function RealityCheckBarometer({
  locale,
  factsCount,
  assumptionsCount,
  unknownsCount,
}: {
  locale: string;
  factsCount: number;
  assumptionsCount: number;
  unknownsCount: number;
}) {
  const result = computeRealityCheck(factsCount, assumptionsCount, unknownsCount);
  const isRtl = locale === "ar";
  const badgeStyle = BADGE_STYLE[result.badge];
  const badgeLabel = isRtl ? BADGE_LABEL[result.badge].ar : BADGE_LABEL[result.badge].en;

  return (
    <div className="fc-strip" style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.6rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: "var(--fc-text-secondary)" }}>
          {result.solidFactsPct}% {isRtl ? "حقائق راسخة" : "Solid Facts"} | {result.assumptionsGapsPct}%{" "}
          {isRtl ? "افتراضات ومعلومات ناقصة" : "Assumptions & Information Gaps"}
        </span>
        <span
          className="fc-pill"
          style={{ color: badgeStyle.color, background: badgeStyle.bg }}
        >
          {badgeLabel}
        </span>
      </div>

      <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${result.solidFactsPct}%`, background: "var(--fc-band-low)" }} />
        <div
          style={{ width: `${result.assumptionsGapsPct}%`, background: "var(--fc-band-moderate)" }}
        />
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--fc-text-muted)", marginTop: "0.5rem", marginBottom: 0 }}>
        {result.factsCount} {isRtl ? "حقائق" : "Facts"} · {result.assumptionsCount}{" "}
        {isRtl ? "افتراضات" : "Assumptions"} · {result.unknownsCount} {isRtl ? "مجاهيل" : "Unknowns"}
      </p>
    </div>
  );
}
