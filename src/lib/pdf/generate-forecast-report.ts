"use client";

import {
  MARGIN,
  CONTENT_WIDTH,
  addHeaderFooter,
  newPage,
  ensureSpace,
  drawHeading,
  measureHeadingHeight,
  drawParagraph,
  measureParagraphHeight,
  drawBulletList,
  measureBulletListHeight,
  drawDivider,
  setFont,
  drawCompactScenarioCard,
  estimateCompactScenarioCardHeight,
  drawColumns,
  measureColumnsHeight,
  drawProportionBar,
  bandColor,
  type PdfContext,
} from "./pdf-writer";
import { PDF_LABELS, type PdfLocale, type PdfLabelSet } from "./pdf-labels";

export interface ReportScenario {
  outcomeType: string | null;
  title: string;
  description: string;
  likelihood: string;
  confidence: string;
  impact: string;
  evidence: string[];
  triggers: string[];
  earlyWarningSigns: string[];
  recommendedResponse: string | null;
}

export interface ForecastReportData {
  locale: string;
  situationText: string;
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  behavioralVariables: string[];
  externalVariables: string[];
  controllableVariables: string[];
  uncontrollableVariables: string[];
  realityCheckLabel: string;
  scenarios: ReportScenario[];
  recommendedAction: { summary: string; conditionalBranches: { condition: string; action: string }[] } | null;
  whatCouldChangeForecast: string[];
  limitsOfForecast: string | null;
  updateNote: string | null;
  outcome: {
    matchedScenarioTitle: string | null;
    whatWentRight: string[];
    whatWasMissed: string[];
    wrongAssumptions: string[];
  } | null;
}

function pdfLocale(siteLocale: string): PdfLocale {
  return siteLocale === "ar" ? "ar" : "en";
}

function scenarioHeading(labels: PdfLabelSet, outcomeType: string | null): string {
  if (outcomeType === "best_case") return labels.bestCase;
  if (outcomeType === "worst_case") return labels.worstCase;
  return labels.mostLikely;
}

export async function generateForecastReport(data: ForecastReportData): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  // Arabic: manual PDF text shaping (jsPDF + a bidi/shaping library)
  // produced visibly disconnected, unjoined letters when checked by
  // rasterizing an actual generated PDF and reading it closely — not
  // a text-extraction artifact, a real rendering defect. Falling back
  // to rendering real HTML and capturing it, which relies on the
  // browser's own Arabic text engine — the same one that already
  // renders every Arabic page on this site correctly.
  if (pdfLocale(data.locale) === "ar") {
    const [{ buildArabicReportHtml }, { renderHtmlToPdf }] = await Promise.all([
      import("./arabic-report-html"),
      import("./html-to-pdf"),
    ]);
    await renderHtmlToPdf(buildArabicReportHtml(data), `FORESEE_Report_${today}.pdf`);
    return;
  }

  const { jsPDF } = await import("jspdf");

  const loc = pdfLocale(data.locale);
  const isRtl = false; // Arabic already handled and returned above
  const labels = PDF_LABELS[loc];

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({
    title: labels.reportTitle,
    author: "FORESEE",
    subject: "Decision Forecast",
    creator: "FORESEE",
  });

  const ctx: PdfContext = { doc, isRtl, reportTitle: labels.reportTitle, pageLabel: labels.page };
  let pageNumber = 1;
  addHeaderFooter(ctx, pageNumber);
  let y = MARGIN.top;

  const dateStr = new Date().toLocaleDateString(isRtl ? "ar" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ---- PAGE 1: SUMMARY + REALITY CHECK + SCENARIO COMPARISON ----
  // Condensed to ~2 pages total (from an earlier 8-page version) at
  // the user's request after testing: same underlying data, denser
  // and more visual presentation (gauges + side-by-side comparison
  // instead of a full prose page per scenario) so it's quick to scan
  // rather than a long read.
  setFont(ctx, "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 45, 42);
  doc.text(labels.brand, MARGIN.left, y + 4, { align: "left" });
  y += 9;
  setFont(ctx, "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 150, 135);
  doc.text(labels.tagline, MARGIN.left, y, { align: "left" });
  doc.setTextColor(20, 20, 20);
  y += 10;
  y = drawDivider(ctx, y);
  y += 2;

  y = drawParagraph(
    ctx,
    `${labels.date}: ${dateStr}    ·    ${labels.language}: English`,
    y,
    { fontSize: 9.5, color: [110, 110, 110] }
  );
  y += 3;

  // Bottom Line first — a reader should see "what should I do" within
  // seconds, before the full breakdown.
  const bottomLineText =
    data.recommendedAction?.summary ??
    (data.scenarios.find((s) => s.outcomeType === "most_likely")?.recommendedResponse ?? labels.notAvailable);
  y = drawHeading(ctx, labels.bottomLine, y, 13);
  y = drawParagraph(ctx, bottomLineText, y, { bold: true });
  y += 3;

  y = drawHeading(ctx, labels.situation, y, 12);
  y = drawParagraph(ctx, data.situationText, y, { fontSize: 9.5 });
  y += 2;

  // Reality Check — proportional bar instead of a paragraph.
  const totalVars = data.facts.length + data.assumptions.length + data.unknowns.length;
  const solidFactsPct = totalVars > 0 ? Math.round((data.facts.length / totalVars) * 100) : 0;
  y = drawHeading(ctx, labels.dataQuality, y, 11);
  y = drawProportionBar(
    ctx,
    y,
    solidFactsPct,
    `${solidFactsPct}% Facts`,
    `${100 - solidFactsPct}% Assumptions/Unknowns`
  );
  y = drawParagraph(
    ctx,
    `${data.facts.length} facts · ${data.assumptions.length} assumptions · ${data.unknowns.length} unknowns — ${data.realityCheckLabel}`,
    y,
    { fontSize: 8, color: [130, 130, 130] }
  );
  y += 2;

  // Scenario comparison — 3 compact cards side by side instead of a
  // full prose page per scenario.
  if (data.scenarios.length > 0) {
    const order = ["best_case", "most_likely", "worst_case"];
    const sorted = [...data.scenarios].sort(
      (a, b) => order.indexOf(a.outcomeType ?? "most_likely") - order.indexOf(b.outcomeType ?? "most_likely")
    );
    const gap = 5;
    const cardWidth = (CONTENT_WIDTH - gap * 2) / 3;
    const cards = sorted.map((s) => ({
      badge: scenarioHeading(labels, s.outcomeType),
      title: s.title,
      description: s.description,
      impact: s.impact,
      confidence: s.confidence,
      response: s.recommendedResponse,
    }));
    const rowHeight = Math.max(...cards.map((c) => estimateCompactScenarioCardHeight(ctx, c, cardWidth)));
    ({ y, pageNumber } = ensureSpace(ctx, y, rowHeight + 4, pageNumber));

    y = drawHeading(ctx, labels.scenarioMap, y, 12);
    const rowTop = y;
    let maxBottom = rowTop;
    cards.forEach((card, i) => {
      const accent =
        sorted[i].outcomeType === "best_case"
          ? ([76, 175, 125] as [number, number, number])
          : sorted[i].outcomeType === "worst_case"
            ? bandColor("high")
            : bandColor("moderate");
      const bottom = drawCompactScenarioCard(ctx, MARGIN.left + i * (cardWidth + gap), cardWidth, rowTop, card, accent);
      maxBottom = Math.max(maxBottom, bottom);
    });
    y = maxBottom + 3;
  }

  // ---- PAGE 2: FACTS/ASSUMPTIONS/UNKNOWNS + KEY VARIABLES + DECISION SUPPORT ----
  pageNumber += 1;
  y = newPage(ctx, pageNumber);

  const factColumns = [
    { heading: labels.knownFacts, items: data.facts.length > 0 ? data.facts : [labels.notAvailable], accentColor: [76, 175, 125] as [number, number, number] },
    { heading: labels.assumptions, items: data.assumptions.length > 0 ? data.assumptions : [labels.notAvailable], accentColor: [219, 165, 73] as [number, number, number] },
    { heading: labels.unknowns, items: data.unknowns.length > 0 ? data.unknowns : [labels.notAvailable], accentColor: [130, 130, 130] as [number, number, number] },
  ];
  ({ y, pageNumber } = ensureSpace(ctx, y, measureColumnsHeight(ctx, factColumns), pageNumber));
  y = drawColumns(ctx, y, factColumns);
  y += 3;
  y = drawDivider(ctx, y);
  y += 3;

  const variableGroups: Array<[string, string[]]> = (
    [
      [labels.behavioralVariables, data.behavioralVariables],
      [labels.externalVariables, data.externalVariables],
      [labels.controllableVariables, data.controllableVariables],
      [labels.uncontrollableVariables, data.uncontrollableVariables],
    ] as Array<[string, string[]]>
  ).filter(([, items]) => items.length > 0);

  if (variableGroups.length > 0) {
    y = drawHeading(ctx, labels.keyVariables, y, 12);
    // Two per row to stay compact.
    for (let i = 0; i < variableGroups.length; i += 2) {
      const pair = variableGroups.slice(i, i + 2).map(([heading, items]) => ({ heading, items }));
      const needed = measureColumnsHeight(ctx, pair, 6);
      ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
      y = drawColumns(ctx, y, pair, 6);
    }
    y += 2;
  }

  if (data.whatCouldChangeForecast.length > 0) {
    const needed = measureHeadingHeight(12) + measureBulletListHeight(ctx, data.whatCouldChangeForecast, 9);
    ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
    y = drawHeading(ctx, labels.whatCouldChange, y, 12);
    y = drawBulletList(ctx, data.whatCouldChangeForecast, y, 9);
  }

  if (data.limitsOfForecast) {
    const needed = measureHeadingHeight(11) + measureParagraphHeight(ctx, data.limitsOfForecast, 8.5);
    ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
    y = drawHeading(ctx, labels.limitsOfForecast, y, 11);
    y = drawParagraph(ctx, data.limitsOfForecast, y, { fontSize: 8.5, color: [130, 130, 130] });
  }
  y += 2;
  y = drawDivider(ctx, y);
  y += 3;

  if (data.recommendedAction) {
    const needed = measureHeadingHeight(12) + measureParagraphHeight(ctx, data.recommendedAction.summary, 9.5);
    ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
    y = drawHeading(ctx, labels.decisionSupport, y, 12);
    y = drawParagraph(ctx, data.recommendedAction.summary, y, { bold: true, fontSize: 9.5 });

    if (data.recommendedAction.conditionalBranches.length > 0) {
      const needed2 = measureHeadingHeight(10.5);
      ({ y, pageNumber } = ensureSpace(ctx, y, needed2, pageNumber));
      y = drawHeading(ctx, labels.ifThen, y, 10.5);
      for (const branch of data.recommendedAction.conditionalBranches) {
        // "→" (U+2192) isn't in jsPDF's default Helvetica encoding —
        // it silently corrupted the rest of the line in testing (a
        // real bug confirmed from an actual generated PDF). "->" is
        // plain ASCII and renders correctly.
        const line = `${branch.condition} -> ${branch.action}`;
        const lineNeeded = measureParagraphHeight(ctx, line, 9);
        ({ y, pageNumber } = ensureSpace(ctx, y, lineNeeded, pageNumber));
        y = drawParagraph(ctx, line, y, { fontSize: 9 });
      }
    }
    y += 2;
  }

  if (data.updateNote) {
    const needed = measureHeadingHeight(11) + measureParagraphHeight(ctx, data.updateNote, 8.5);
    ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
    y = drawHeading(ctx, labels.updateHistory, y, 11);
    y = drawParagraph(ctx, data.updateNote, y, { fontSize: 8.5 });
    y += 2;
  }

  if (data.outcome) {
    const needed = measureHeadingHeight(11) + 6;
    ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
    y = drawHeading(ctx, labels.outcome, y, 11);
    y = drawParagraph(
      ctx,
      `${labels.matchedScenario}: ${data.outcome.matchedScenarioTitle ?? labels.notAvailable}`,
      y,
      { bold: true, fontSize: 9 }
    );
    const outcomeSections: Array<[string, string[]]> = [
      [labels.whatWentRight, data.outcome.whatWentRight],
      [labels.whatWasMissed, data.outcome.whatWasMissed],
      [labels.wrongAssumptions, data.outcome.wrongAssumptions],
    ].filter(([, items]) => items.length > 0) as Array<[string, string[]]>;
    if (outcomeSections.length > 0) {
      const pairs = outcomeSections.map(([heading, items]) => ({ heading, items }));
      const needed2 = measureColumnsHeight(ctx, pairs, 6);
      ({ y, pageNumber } = ensureSpace(ctx, y, needed2, pageNumber));
      y = drawColumns(ctx, y, pairs, 6);
    }
  } else {
    y = drawParagraph(ctx, `${labels.outcome}: ${labels.outcomeNotRecorded}`, y, { fontSize: 8.5, color: [150, 150, 150] });
  }

  doc.save(`FORESEE_Report_${today}.pdf`);
}
