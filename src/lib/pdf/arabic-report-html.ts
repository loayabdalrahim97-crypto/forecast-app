import { PDF_LABELS } from "./pdf-labels";
import type { ForecastReportData } from "./generate-forecast-report";

const S = PDF_LABELS.ar;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function section(heading: string, items: string[]): string {
  if (items.length === 0) return "";
  return `
    <h2 style="font-size:15px;color:#0f3c37;margin:14px 0 6px;">${escapeHtml(heading)}</h2>
    <ul style="margin:0 0 10px;padding-inline-start:20px;">
      ${items.map((i) => `<li style="margin-bottom:5px;line-height:1.6;">${escapeHtml(i)}</li>`).join("")}
    </ul>`;
}

function scenarioLabel(outcomeType: string | null): string {
  if (outcomeType === "best_case") return S.bestCase;
  if (outcomeType === "worst_case") return S.worstCase;
  return S.mostLikely;
}

/**
 * Builds the full Arabic report as one HTML document, rendered
 * off-screen and captured via html2canvas — this relies on the
 * browser's own Arabic text engine (the same one that renders every
 * other Arabic page on this site correctly), sidestepping manual PDF
 * text shaping entirely after it produced visibly disconnected letters
 * in testing (confirmed by zooming into an actual generated PDF).
 */
export function buildArabicReportHtml(data: ForecastReportData): string {
  const dateStr = new Date().toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });

  const order = ["best_case", "most_likely", "worst_case"];
  const sortedScenarios = [...data.scenarios].sort(
    (a, b) => order.indexOf(a.outcomeType ?? "most_likely") - order.indexOf(b.outcomeType ?? "most_likely")
  );

  const variableGroups: Array<[string, string[]]> = [
    [S.behavioralVariables, data.behavioralVariables],
    [S.externalVariables, data.externalVariables],
    [S.controllableVariables, data.controllableVariables],
    [S.uncontrollableVariables, data.uncontrollableVariables],
  ];

  const factsAssumptionsLine = `${data.facts.length} حقيقة معروفة، ${data.assumptions.length} افتراض، و${data.unknowns.length} مجهول تم تحديدهم. ${escapeHtml(data.realityCheckLabel)}.`;
  const topScenario = sortedScenarios.find((s) => s.outcomeType === "most_likely") ?? sortedScenarios[0];

  return `
  <div dir="rtl" lang="ar" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color:#141414; background:#ffffff; width:750px; padding:40px; line-height:1.7; font-size:14px;">
    <div style="border-bottom:1px solid #ddd; padding-bottom:14px; margin-bottom:16px;">
      <h1 style="font-size:26px; color:#0f2d2a; margin:0 0 4px;">${escapeHtml(S.brand)}</h1>
      <p style="color:#5a9687; margin:0; font-size:13px;">${escapeHtml(S.tagline)}</p>
    </div>

    <p style="color:#6e6e6e; font-size:12.5px; margin:0 0 16px;">
      ${escapeHtml(S.date)}: ${dateStr} &nbsp;·&nbsp; ${escapeHtml(S.language)}: العربية &nbsp;·&nbsp; ${escapeHtml(S.dataQuality)}: ${escapeHtml(data.realityCheckLabel)}
    </p>

    <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.situation)}</h2>
    <p style="margin:0 0 14px;">${escapeHtml(data.situationText)}</p>

    ${data.recommendedAction ? `
      <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.executiveSummary)}</h2>
      <p style="margin:0 0 4px;">${factsAssumptionsLine}</p>
      ${topScenario ? `<p style="margin:0 0 14px;">أرجح سيناريو مبني عليه: "${escapeHtml(topScenario.title)}".</p>` : ""}
    ` : ""}

    <div style="border:1px solid #ddd; border-radius:8px; padding:14px; background:#f7f9f8; margin-bottom:10px;">
      <h2 style="font-size:14px;color:#0f3c37;margin:0 0 6px;">${escapeHtml(S.bottomLine)}</h2>
      <p style="margin:0; font-weight:600;">${escapeHtml(data.recommendedAction?.summary ?? (topScenario?.recommendedResponse ?? S.notAvailable))}</p>
    </div>

    <div style="page-break-before: always;"></div>

    ${section(S.knownFacts, data.facts)}
    ${section(S.assumptions, data.assumptions)}
    ${section(S.unknowns, data.unknowns)}

    <div style="page-break-before: always;"></div>

    <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.keyVariables)}</h2>
    ${variableGroups.map(([h, items]) => section(h, items)).join("")}
    ${section(S.whatCouldChange, data.whatCouldChangeForecast)}
    ${data.limitsOfForecast ? `
      <h2 style="font-size:14px;color:#888;margin:14px 0 6px;">${escapeHtml(S.limitsOfForecast)}</h2>
      <p style="margin:0 0 10px; color:#888; font-size:12.5px; font-style:italic;">${escapeHtml(data.limitsOfForecast)}</p>
    ` : ""}

    <div style="page-break-before: always;"></div>

    <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.scenarioMap)}</h2>
    ${sortedScenarios
      .map(
        (sc) => `
      <div style="border-right:3px solid ${sc.outcomeType === "best_case" ? "#4caf7d" : sc.outcomeType === "worst_case" ? "#c85041" : "#c8963c"}; padding:10px 14px; margin-bottom:10px; background:#f7f9f8; border-radius:4px;">
        <p style="margin:0 0 2px; color:#888; font-size:11px;">${escapeHtml(scenarioLabel(sc.outcomeType))}</p>
        <p style="margin:0 0 4px; font-weight:700; font-size:14px;">${escapeHtml(sc.title)}</p>
        <p style="margin:0 0 6px; color:#555; font-size:12.5px;">${escapeHtml(sc.description)}</p>
        <p style="margin:0; font-size:11.5px; color:#777;">${escapeHtml(S.likelihood)}: ${sc.likelihood} &nbsp; ${escapeHtml(S.confidence)}: ${sc.confidence} &nbsp; ${escapeHtml(S.impact)}: ${sc.impact}</p>
      </div>`
      )
      .join("")}

    <div style="page-break-before: always;"></div>

    <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.scenarioDetails)}</h2>
    ${sortedScenarios
      .map(
        (sc) => `
      <h3 style="font-size:14px; margin:14px 0 4px;">${escapeHtml(scenarioLabel(sc.outcomeType))} — ${escapeHtml(sc.title)}</h3>
      <p style="margin:0 0 8px;">${escapeHtml(sc.description)}</p>
      ${section(S.whyItCouldHappen, sc.evidence)}
      ${section(S.whatWouldTrigger, sc.triggers)}
      ${section(S.earlyWarningSigns, sc.earlyWarningSigns)}
      ${sc.recommendedResponse ? `<p style="margin:0 0 10px;"><strong>${escapeHtml(S.recommendedResponse)}:</strong> ${escapeHtml(sc.recommendedResponse)}</p>` : ""}
      <hr style="border:none;border-top:1px solid #ddd;margin:10px 0;" />
    `
      )
      .join("")}

    ${data.recommendedAction ? `
      <div style="page-break-before: always;"></div>
      <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.decisionSupport)}</h2>
      <h3 style="font-size:14px;">${escapeHtml(S.recommendedAction)}</h3>
      <p style="margin:0 0 10px; font-weight:600;">${escapeHtml(data.recommendedAction.summary)}</p>
      ${data.recommendedAction.conditionalBranches.length > 0 ? `
        <h3 style="font-size:14px;">${escapeHtml(S.ifThen)}</h3>
        ${data.recommendedAction.conditionalBranches
          .map((b) => `<p style="margin:0 0 6px;">${escapeHtml(b.condition)} ← ${escapeHtml(b.action)}</p>`)
          .join("")}
      ` : ""}
    ` : ""}

    ${data.updateNote ? `
      <div style="page-break-before: always;"></div>
      <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.updateHistory)}</h2>
      <h3 style="font-size:14px;">${escapeHtml(S.newInformation)}</h3>
      <p style="margin:0; white-space:pre-line;">${escapeHtml(data.updateNote)}</p>
    ` : ""}

    <div style="page-break-before: always;"></div>
    <h2 style="font-size:16px;color:#0f3c37;">${escapeHtml(S.outcome)}</h2>
    ${!data.outcome ? `<p style="color:#999;">${escapeHtml(S.outcomeNotRecorded)}</p>` : `
      <h3 style="font-size:14px;">${escapeHtml(S.forecastVsReality)}</h3>
      <p style="margin:0 0 8px; font-weight:600;">${escapeHtml(S.matchedScenario)}: ${escapeHtml(data.outcome.matchedScenarioTitle ?? S.notAvailable)}</p>
      ${section(S.whatWentRight, data.outcome.whatWentRight)}
      ${section(S.whatWasMissed, data.outcome.whatWasMissed)}
      ${section(S.wrongAssumptions, data.outcome.wrongAssumptions)}
    `}
  </div>`;
}
