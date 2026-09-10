"use client";

type Band = "low" | "moderate" | "high";

const BAND_ORDER: Band[] = ["low", "moderate", "high"];

export function normalizeBand(value: string): Band {
  const v = value.toLowerCase();
  if (v === "low" || v === "moderate" || v === "high") return v;
  return "moderate";
}

/**
 * A 3-segment meter instead of a text label — the person scans the
 * fill, not a sentence. Deliberately only 3 segments (matching the
 * low/moderate/high bands the whole product uses): a finer-grained bar
 * would imply a precision the underlying data doesn't have (§13 bans
 * fabricated percentages), so the gauge's resolution matches what's
 * actually known.
 */
export function BandGauge({ label, value }: { label: string; value: string }) {
  const band = normalizeBand(value);
  const activeIndex = BAND_ORDER.indexOf(band);
  const color = `var(--fc-band-${band})`;

  return (
    <div style={{ minWidth: 110 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.72rem",
          color: "var(--fc-text-muted)",
          marginBottom: "0.3rem",
        }}
      >
        <span>{label}</span>
        <span style={{ color, fontWeight: 600, textTransform: "capitalize" }}>{band}</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {BAND_ORDER.map((_, i) => (
          <div
            key={i}
            style={{
              height: 5,
              flex: 1,
              borderRadius: 999,
              background: i <= activeIndex ? color : "var(--fc-bg-elevated)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
