"use client";

import {
  PAGE,
  MARGIN,
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
  bandColor,
  setFont,
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

  // ---- PAGE 1: SUMMARY ----
  setFont(ctx, "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 45, 42);
  doc.text(labels.brand, isRtl ? PAGE.width - MARGIN.right : MARGIN.left, y + 4, {
    align: isRtl ? "right" : "left",
  });
  y += 9;
  setFont(ctx, "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 150, 135);
  doc.text(labels.tagline, isRtl ? PAGE.width - MARGIN.right : MARGIN.left, y, { align: isRtl ? "right" : "left" });
  doc.setTextColor(20, 20, 20);
  y += 10;
  y = drawDivider(ctx, y);
  y += 2;

  y = drawParagraph(
    ctx,
    `${labels.date}: ${dateStr}    ·    ${labels.language}: ${isRtl ? "العربية" : "English"}    ·    ${labels.dataQuality}: ${data.realityCheckLabel}`,
    y,
    { fontSize: 9.5, color: [110, 110, 110] }
  );
  y += 4;

  y = drawHeading(ctx, labels.situation, y);
  y = drawParagraph(ctx, data.situationText, y);
  y += 4;

  if (data.recommendedAction) {
    y = drawHeading(ctx, labels.executiveSummary, y);
    const factsAssumptionsLine =
      isRtl
        ? `${data.facts.length} حقيقة معروفة، ${data.assumptions.length} افتراض، و${data.unknowns.length} مجهول تم تحديدهم. ${data.realityCheckLabel}.`
        : `${data.facts.length} known fact(s), ${data.assumptions.length} assumption(s), and ${data.unknowns.length} unknown(s) identified. ${data.realityCheckLabel}.`;
    y = drawParagraph(ctx, factsAssumptionsLine, y);
    if (data.scenarios.length > 0) {
      const topScenario = data.scenarios.find((s) => s.outcomeType === "most_likely") ?? data.scenarios[0];
      const scenarioLine = isRtl
        ? `أرجح سيناريو مبني عليه: "${topScenario.title}".`
        : `The most likely scenario considered: "${topScenario.title}".`;
      y = drawParagraph(ctx, scenarioLine, y);
    }
    y += 3;
  }

  y += 6;
  ({ y, pageNumber } = ensureSpace(ctx, y, 20, pageNumber));
  y = drawHeading(ctx, labels.bottomLine, y, 12);
  const bottomLineText =
    data.recommendedAction?.summary ??
    (data.scenarios.find((s) => s.outcomeType === "most_likely")?.recommendedResponse ?? labels.notAvailable);
  y = drawParagraph(ctx, bottomLineText, y, { bold: true });

  // ---- PAGE 2: WHAT WE KNOW ----
  pageNumber += 1;
  y = newPage(ctx, pageNumber);

  y = drawHeading(ctx, labels.knownFacts, y, 15);
  y =
    data.facts.length > 0
      ? drawBulletList(ctx, data.facts, y)
      : drawParagraph(ctx, labels.notAvailable, y, { color: [140, 140, 140] });
  y += 4;

  y = drawHeading(ctx, labels.assumptions, y, 15);
  y =
    data.assumptions.length > 0
      ? drawBulletList(ctx, data.assumptions, y)
      : drawParagraph(ctx, labels.notAvailable, y, { color: [140, 140, 140] });
  y += 4;

  y = drawHeading(ctx, labels.unknowns, y, 15);
  y =
    data.unknowns.length > 0
      ? drawBulletList(ctx, data.unknowns, y)
      : drawParagraph(ctx, labels.notAvailable, y, { color: [140, 140, 140] });

  // ---- PAGE 3: KEY VARIABLES ----
  pageNumber += 1;
  y = newPage(ctx, pageNumber);
  y = drawHeading(ctx, labels.keyVariables, y, 15);

  const variableGroups: Array<[string, string[]]> = (
    [
      [labels.behavioralVariables, data.behavioralVariables],
      [labels.externalVariables, data.externalVariables],
      [labels.controllableVariables, data.controllableVariables],
      [labels.uncontrollableVariables, data.uncontrollableVariables],
    ] as Array<[string, string[]]>
  ).filter(([, items]) => items.length > 0);

  if (variableGroups.length === 0) {
    y = drawParagraph(ctx, labels.notAvailable, y, { color: [140, 140, 140] });
  } else {
    for (const [heading, items] of variableGroups) {
      const needed = measureHeadingHeight(11) + measureBulletListHeight(ctx, items);
      ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
      y = drawHeading(ctx, heading, y, 11);
      y = drawBulletList(ctx, items, y);
      y += 2;
    }
  }
  y += 4;

  if (data.whatCouldChangeForecast.length > 0) {
    const needed = measureHeadingHeight(15) + measureBulletListHeight(ctx, data.whatCouldChangeForecast);
    ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
    y = drawHeading(ctx, labels.whatCouldChange, y, 15);
    y = drawBulletList(ctx, data.whatCouldChangeForecast, y);
  }

  // ---- PAGE 4: SCENARIO MAP ----
  if (data.scenarios.length > 0) {
    pageNumber += 1;
    y = newPage(ctx, pageNumber);
    y = drawHeading(ctx, labels.scenarioMap, y, 15);

    const order = ["best_case", "most_likely", "worst_case"];
    const sorted = [...data.scenarios].sort(
      (a, b) => order.indexOf(a.outcomeType ?? "most_likely") - order.indexOf(b.outcomeType ?? "most_likely")
    );

    for (const scenario of sorted) {
      const cardHeight = 8 + measureParagraphHeight(ctx, scenario.description, 10) + 10;
      ({ y, pageNumber } = ensureSpace(ctx, y, cardHeight + 6, pageNumber));

      setFont(ctx, "bold");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(scenarioHeading(labels, scenario.outcomeType), isRtl ? PAGE.width - MARGIN.right : MARGIN.left, y, {
        align: isRtl ? "right" : "left",
      });
      y += 5;
      y = drawParagraph(ctx, scenario.title, y, { bold: true, fontSize: 12 });
      y = drawParagraph(ctx, scenario.description, y, { fontSize: 9.5, color: [90, 90, 90] });

      const badges = `${labels.likelihood}: ${scenario.likelihood}   ${labels.confidence}: ${scenario.confidence}   ${labels.impact}: ${scenario.impact}`;
      y = drawParagraph(ctx, badges, y, { fontSize: 9, color: bandColor(scenario.impact) });
      y = drawDivider(ctx, y + 1);
      y += 3;
    }
  }

  // ---- PAGE 5: SCENARIO DETAILS ----
  if (data.scenarios.length > 0) {
    pageNumber += 1;
    y = newPage(ctx, pageNumber);
    y = drawHeading(ctx, labels.scenarioDetails, y, 15);

    const order = ["best_case", "most_likely", "worst_case"];
    const sorted = [...data.scenarios].sort(
      (a, b) => order.indexOf(a.outcomeType ?? "most_likely") - order.indexOf(b.outcomeType ?? "most_likely")
    );

    for (const scenario of sorted) {
      ({ y, pageNumber } = ensureSpace(ctx, y, 30, pageNumber));
      y = drawHeading(ctx, `${scenarioHeading(labels, scenario.outcomeType)} — ${scenario.title}`, y, 12);
      y = drawParagraph(ctx, scenario.description, y);

      const subsections: Array<[string, string[]]> = [
        [labels.whyItCouldHappen, scenario.evidence],
        [labels.whatWouldTrigger, scenario.triggers],
        [labels.earlyWarningSigns, scenario.earlyWarningSigns],
      ];
      for (const [heading, items] of subsections) {
        if (items.length === 0) continue;
        const needed = measureHeadingHeight(10.5) + measureBulletListHeight(ctx, items, 9.5);
        ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
        y = drawHeading(ctx, heading, y, 10.5);
        y = drawBulletList(ctx, items, y, 9.5);
      }

      if (scenario.recommendedResponse) {
        const needed = measureHeadingHeight(10.5) + measureParagraphHeight(ctx, scenario.recommendedResponse, 9.5);
        ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
        y = drawHeading(ctx, labels.recommendedResponse, y, 10.5);
        y = drawParagraph(ctx, scenario.recommendedResponse, y, { fontSize: 9.5 });
      }
      y = drawDivider(ctx, y + 2);
      y += 3;
    }
  }

  // ---- PAGE 6: DECISION SUPPORT ----
  if (data.recommendedAction) {
    pageNumber += 1;
    y = newPage(ctx, pageNumber);
    y = drawHeading(ctx, labels.decisionSupport, y, 15);

    y = drawHeading(ctx, labels.recommendedAction, y, 12);
    y = drawParagraph(ctx, data.recommendedAction.summary, y, { bold: true });
    y += 3;

    if (data.recommendedAction.conditionalBranches.length > 0) {
      y = drawHeading(ctx, labels.ifThen, y, 12);
      for (const branch of data.recommendedAction.conditionalBranches) {
        const line = `${branch.condition} → ${branch.action}`;
        const needed = measureParagraphHeight(ctx, line);
        ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
        y = drawParagraph(ctx, line, y);
      }
    }
  }

  // ---- PAGE 7: UPDATE HISTORY ----
  if (data.updateNote) {
    pageNumber += 1;
    y = newPage(ctx, pageNumber);
    y = drawHeading(ctx, labels.updateHistory, y, 15);
    y = drawHeading(ctx, labels.newInformation, y, 11);
    y = drawParagraph(ctx, data.updateNote, y);
  }

  // ---- PAGE 8: OUTCOME ----
  pageNumber += 1;
  y = newPage(ctx, pageNumber);
  y = drawHeading(ctx, labels.outcome, y, 15);

  if (!data.outcome) {
    y = drawParagraph(ctx, labels.outcomeNotRecorded, y, { color: [140, 140, 140] });
  } else {
    y = drawHeading(ctx, labels.forecastVsReality, y, 12);
    y = drawParagraph(
      ctx,
      `${labels.matchedScenario}: ${data.outcome.matchedScenarioTitle ?? labels.notAvailable}`,
      y,
      { bold: true }
    );
    y += 2;

    const outcomeSections: Array<[string, string[]]> = [
      [labels.whatWentRight, data.outcome.whatWentRight],
      [labels.whatWasMissed, data.outcome.whatWasMissed],
      [labels.wrongAssumptions, data.outcome.wrongAssumptions],
    ];
    for (const [heading, items] of outcomeSections) {
      if (items.length === 0) continue;
      const needed = measureHeadingHeight(11) + measureBulletListHeight(ctx, items);
      ({ y, pageNumber } = ensureSpace(ctx, y, needed, pageNumber));
      y = drawHeading(ctx, heading, y, 11);
      y = drawBulletList(ctx, items, y);
    }
  }

  doc.save(`FORESEE_Report_${today}.pdf`);
}
