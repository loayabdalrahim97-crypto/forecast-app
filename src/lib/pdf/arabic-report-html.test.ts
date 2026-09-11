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

  it("includes the situation text verbatim (no fabricated content)", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain("موقف تجريبي للاختبار");
  });

  it("includes facts, assumptions, and unknowns as separate sections", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain("حقيقة أولى");
    expect(html).toContain("افتراض أول");
    expect(html).toContain("مجهول أول");
  });

  it("shows 'not recorded' when no outcome exists, not an empty/undefined section", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).toContain("لم تُسجَّل نتيجة بعد");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("null");
  });

  it("escapes HTML special characters in user-supplied text (no injection)", () => {
    const html = buildArabicReportHtml({
      ...baseData,
      situationText: "<script>alert(1)</script> & \"quotes\"",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omits the update-history section entirely when there was no update", () => {
    const html = buildArabicReportHtml(baseData);
    expect(html).not.toContain("تحديثات التوقع");
  });

  it("includes the update-history section when an update note exists", () => {
    const html = buildArabicReportHtml({ ...baseData, updateNote: "معلومة جديدة تمت إضافتها" });
    expect(html).toContain("تحديثات التوقع");
    expect(html).toContain("معلومة جديدة تمت إضافتها");
  });
});
