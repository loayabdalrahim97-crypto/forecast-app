import { PDF_LABELS } from "./pdf-labels";
import type { ForecastReportData } from "./generate-forecast-report";

const S = PDF_LABELS.ar;

// Mirrors the color language of the English report's pdf-writer.ts
// (bandColor / drawProportionBar) so the two versions read as the
// same product, just in a different script.
const GREEN = "#4caf7d"; // facts / best case / low band
const AMBER = "#dba549"; // assumptions / moderate band
const RED = "#c85041"; // worst case / high band
const GREY = "#828282"; // unknowns / neutral

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const headingStyle = "font-weight:700;line-height:1.4;direction:rtl;color:#0f3c37;margin:0 0 8px;";

function heading(text: string, size = 15): string {
  return `<div style="${headingStyle}font-size:${size}px;">${escapeHtml(text)}</div>`;
}

function bandColor(band: string): string {
  const v = band.toLowerCase();
  if (v === "high") return RED;
  if (v === "low") return GREEN;
  return AMBER;
}

const BAND_ORDER = ["low", "moderate", "high"];

/** A small 3-segment gauge matching the English report's drawMiniGauge. */
function miniGauge(label: string, value: string): string {
  const color = bandColor(value);
  const activeIndex = Math.max(0, BAND_ORDER.indexOf(value.toLowerCase()));
  const segments = [0, 1, 2]
    .map(
      (i) =>
        `<span style="flex:1;height:4px;border-radius:2px;background:${i <= activeIndex ? color : "#e5e5e5"};"></span>`
    )
    .join("");
  return `
    <div style="margin:0 0 5px;">
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#999;margin:0 0 2px;">
        <span>${escapeHtml(label)}</span>
        <span style="color:${color};font-weight:700;">${escapeHtml(value)}</span>
      </div>
      <div style="display:flex;gap:2px;">${segments}</div>
    </div>`;
}

function scenarioBadge(outcomeType: string | null): { label: string; color: string } {
  if (outcomeType === "best_case") return { label: S.bestCase, color: GREEN };
  if (outcomeType === "worst_case") return { label: S.worstCase, color: RED };
  if (outcomeType === "positive") return { label: S.positiveOutcome, color: GREEN };
  if (outcomeType === "negative") return { label: S.negativeOutcome, color: RED };
  if (outcomeType === "mixed") return { label: S.mixedOutcome, color: AMBER };
  return { label: S.mostLikely, color: AMBER };
}

/** A compact scenario card — mirrors drawCompactScenarioCard in the English report. */
function scenarioCard(sc: ForecastReportData["scenarios"][number]): string {
  const badge = scenarioBadge(sc.outcomeType);
  return `
    <div style="flex:1;min-width:0;border-top:3px solid ${badge.color};padding:10px 4px 0;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:${badge.color};">${escapeHtml(badge.label)}</p>
      <p style="margin:0 0 5px;font-size:12.5px;font-weight:700;color:#141414;line-height:1.35;">${escapeHtml(sc.title)}</p>
      <p style="margin:0 0 8px;font-size:10px;color:#666;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(sc.description)}</p>
      ${miniGauge(S.impact, sc.impact)}
      ${miniGauge(S.confidence, sc.confidence)}
      ${sc.recommendedResponse ? `<p style="margin:6px 0 0;font-size:9.5px;font-weight:700;color:#0f3c37;line-height:1.5;">${escapeHtml(sc.recommendedResponse)}</p>` : ""}
    </div>`;
}

/** One of the three Facts / Assumptions / Unknowns columns. */
function column(title: string, items: string[], color: string): string {
  const rows = (items.length > 0 ? items : [S.notAvailable])
    .map((i) => `<li style="margin:0 0 5px;line-height:1.5;">${escapeHtml(i)}</li>`)
    .join("");
  return `
    <div style="flex:1;min-width:0;">
      <p style="margin:0 0 6px;font-size:11.5px;font-weight:700;color:${color};">${escapeHtml(title)}</p>
      <ul style="margin:0;padding-inline-start:16px;font-size:10px;color:#333;">${rows}</ul>
    </div>`;
}

/**
 * Builds the full Arabic report as one HTML document, rendered
 * off-screen and captured via html2canvas — the browser's own Arabic
 * text engine handles shaping/bidi correctly. Section headings are
 * plain styled <div>s rather than <h2>/<h3>: those tags specifically
 * (not the font, not line-height, not direction, not scale) were
 * confirmed — across several rounds of testing against real exported
 * PDFs — to render Arabic text overlapping/garbled, while identical
 * text in <p>/<li>/<div> always rendered correctly.
 *
 * Structure mirrors the English report (generate-forecast-report.ts)
 * section-for-section — bottom line, situation, data quality bar,
 * compact scenario cards, three-column facts/assumptions/unknowns,
 * decision support, if/then — with the same trims already applied to
 * the English version (no separate "key variables", "what could
 * change", "limits", "update history", or "outcome" sections) so the
 * two stay in parity rather than the Arabic version being a longer,
 * differently-organized document.
 */
export function buildArabicReportHtml(data: ForecastReportData): string {
  const dateStr = new Date().toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });

  const order = ["best_case", "most_likely", "worst_case", "positive", "mixed", "negative"];
  const sortedScenarios = [...data.scenarios].sort(
    (a, b) => order.indexOf(a.outcomeType ?? "most_likely") - order.indexOf(b.outcomeType ?? "most_likely")
  );
  const hasPaths = data.scenarios.some((s) => s.pathLabel);
  const pathGroups: { pathLabel: string | null; scenarios: typeof sortedScenarios }[] = hasPaths
    ? Array.from(
        sortedScenarios.reduce((map, s) => {
          const key = s.pathLabel ?? "";
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(s);
          return map;
        }, new Map<string, typeof sortedScenarios>())
      ).map(([pathLabel, scenarios]) => ({ pathLabel, scenarios }))
    : [{ pathLabel: null, scenarios: sortedScenarios }];

  const topScenario = sortedScenarios.find((s) => s.outcomeType === "most_likely") ?? sortedScenarios[0];
  const bottomLineText = data.recommendedAction?.summary ?? topScenario?.recommendedResponse ?? S.notAvailable;

  const totalVars = data.facts.length + data.assumptions.length + data.unknowns.length;
  const solidFactsPct = totalVars > 0 ? Math.round((data.facts.length / totalVars) * 100) : 0;

  return `
  <div dir="rtl" lang="ar" style="font-family: var(--fc-font-sans, 'Segoe UI'), Tahoma, Arial, sans-serif; color:#141414; background:#ffffff; width:750px; padding:40px; line-height:1.7; font-size:13px;">

    <div style="border-bottom:1px solid #ddd; padding-bottom:14px; margin-bottom:16px;">
      <h1 style="font-size:24px; color:#0f2d2a; margin:0 0 3px;">Foresee</h1>
      <p style="color:#5a9687; margin:0; font-size:12px;">AI Decision Intelligence</p>
    </div>

    <p style="color:#8a8a8a; font-size:10.5px; margin:0 0 18px;">
      ${escapeHtml(S.date)}: ${dateStr} &nbsp;·&nbsp; ${escapeHtml(S.language)}: العربية
    </p>

    ${heading(S.bottomLine)}
    <p style="margin:0 0 18px;font-weight:700;font-size:13px;">${escapeHtml(bottomLineText)}</p>

    ${heading(S.situation, 13)}
    <p style="margin:0 0 18px;color:#333;">${escapeHtml(data.situationText)}</p>

    ${heading(S.dataQuality, 13)}
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#5a5a5a;margin:0 0 3px;">
      <span>${solidFactsPct}% ${escapeHtml(S.knownFacts)}</span>
      <span>${100 - solidFactsPct}% ${escapeHtml(S.assumptions)}/${escapeHtml(S.unknowns)}</span>
    </div>
    <div style="display:flex;height:5px;border-radius:3px;overflow:hidden;margin:0 0 6px;">
      <div style="width:${solidFactsPct}%;background:${GREEN};"></div>
      <div style="width:${100 - solidFactsPct}%;background:${AMBER};"></div>
    </div>
    <p style="margin:0 0 22px;font-size:10px;color:#999;">
      ${data.facts.length} ${escapeHtml(S.knownFacts)} · ${data.assumptions.length} ${escapeHtml(S.assumptions)} · ${data.unknowns.length} ${escapeHtml(S.unknowns)} — ${escapeHtml(data.realityCheckLabel)}
    </p>

    ${
      sortedScenarios.length > 0
        ? `
      ${heading(S.scenarioMap, 14)}
      ${pathGroups
        .map(
          (group) => `
        ${group.pathLabel ? `<p style="margin:12px 0 8px;font-size:11.5px;font-weight:700;color:#0f3c37;">${escapeHtml(S.decisionPath)}: ${escapeHtml(group.pathLabel)}</p>` : ""}
        <div style="display:flex;gap:14px;margin:0 0 20px;align-items:stretch;">
          ${group.scenarios.map(scenarioCard).join("")}
        </div>`
        )
        .join("")}
    `
        : ""
    }

    <div style="page-break-before: always;"></div>

    <div style="display:flex;gap:20px;margin:0 0 20px;">
      ${column(S.knownFacts, data.facts, GREEN)}
      ${column(S.assumptions, data.assumptions, AMBER)}
      ${column(S.unknowns, data.unknowns, GREY)}
    </div>

    <div style="border-top:1px solid #ddd;margin:0 0 18px;"></div>

    ${
      data.recommendedAction
        ? `
      ${heading(S.decisionSupport, 14)}
      <p style="margin:0 0 14px;font-weight:700;font-size:12px;">${escapeHtml(data.recommendedAction.summary)}</p>
      ${
        data.recommendedAction.conditionalBranches.length > 0
          ? `
        ${heading(S.ifThen, 12)}
        ${data.recommendedAction.conditionalBranches
          .map((b) => `<p style="margin:0 0 7px;font-size:11px;">${escapeHtml(b.condition)} ← ${escapeHtml(b.action)}</p>`)
          .join("")}
      `
          : ""
      }
    `
        : ""
    }
  </div>`;
}
