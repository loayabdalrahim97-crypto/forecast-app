import { describe, expect, it } from "vitest";
import { buildArabicReportHtml } from "./arabic-report-html";
import type { ForecastReportData } from "./generate-forecast-report";

const baseData: ForecastReportData = {
  locale: "ar",
  situationText: "موقف تجريبي للاختبار",
  facts: ["حقيقة أولى"],
  assumptions: ["افتراض أول"],
  unknowns: ["مجهول أول"],
  behavioralVariables: [],
  externalVariables: [],
  controllableVariables: [],
  uncontrollableVariables: [],
  realityCheckLabel: "أدلة متوازنة",
  scenarios: [
    {
      outcomeType: "most_likely",
      title: "عنوان السيناريو",
      description: "وصف السيناريو",
      likelihood: "moderate",
      confidence: "moderate",
      impact: "high",
      evidence: [],
      triggers: [],
      earlyWarningSigns: [],
      recommendedResponse: "استجابة موصى بها",
    },
  ],
  recommendedAction: { summary: "توصية أساسية", conditionalBranches: [] },
  whatCouldChangeForecast: [],
  limitsOfForecast: null,
  updateNote: null,
  outcome: null,
};

describe("buildArabicReportHtml", () => {
  it("marks the document as RTL Arabic", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
  });

  it("shows the brand name in English, not the Arabic transliteration", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain(">Foresee<");
    expect(html).not.toContain("فورسي");
  });

  it("never renders a heading as an <h2>/<h3> tag (confirmed source of garbled Arabic text)", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).not.toMatch(/<h2[ >]/);
    expect(html).not.toMatch(/<h3[ >]/);
  });

  it("includes the situation text verbatim (no fabricated content)", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain("موقف تجريبي للاختبار");
  });

  it("includes facts, assumptions, and unknowns", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain("حقيقة أولى");
    expect(html).toContain("افتراض أول");
    expect(html).toContain("مجهول أول");
  });

  it("includes the bottom line and decision support summary", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain("توصية أساسية");
  });

  it("includes the scenario title and recommended response", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain("عنوان السيناريو");
    expect(html).toContain("استجابة موصى بها");
  });

  it("omits sections trimmed from the condensed report (key variables, update history, outcome)", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).not.toContain("تحديثات التوقع");
    expect(html).not.toContain("ماذا حدث فعلاً");
  });

  it("escapes HTML special characters in user-supplied text (no injection)", () => {
    const html = buildArabicReportHtml({
      ...baseData,
      situationText: "<script>alert(1)</script> & \"quotes\"",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
