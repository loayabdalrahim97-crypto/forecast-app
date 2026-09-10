import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { render as shapeArabic } from "bidi-shaper";
import { measureWrappedLines, type PdfContext } from "./pdf-writer";

/**
 * Regression test for a real bug found in a generated PDF: Arabic text
 * was being shaped (contextual joining + bidi reorder) on the WHOLE
 * paragraph, and only THEN split into lines by width. Since shaping
 * depends on line boundaries, that produced scrambled output —
 * doubly-reversed letters and word order once a paragraph wrapped to
 * more than one line. The correct order is: wrap the original logical
 * text first, then shape each resulting line independently.
 */
describe("measureWrappedLines (Arabic wrap-before-shape)", () => {
  it("each returned line matches shaping the RAW (unshaped) split, not a slice of the fully-shaped paragraph", () => {
    const doc = new jsPDF();
    const ctx: PdfContext = { doc, isRtl: true, reportTitle: "x", pageLabel: "صفحة" };

    const longArabicText =
      "أعمل في شركتي الحالية منذ سنتين وتقديري ممتاز، وتلقيت عرضاً من شركة منافسة براتب أعلى بكثير وأنا محتار جداً من اتخاذ القرار الصحيح";

    const narrowWidth = 60; // forces multiple lines
    const fontSize = 10;

    const actualLines = measureWrappedLines(ctx, longArabicText, fontSize, narrowWidth);

    // Independently compute the "correct" answer: wrap the RAW text
    // first (on a fresh doc, same settings), then shape each line.
    const rawDoc = new jsPDF();
    rawDoc.setFontSize(fontSize);
    const rawLines = rawDoc.splitTextToSize(longArabicText, narrowWidth) as string[];
    const expectedLines = rawLines.map((line) => shapeArabic(line));

    expect(actualLines).toEqual(expectedLines);
    // Sanity check this test actually exercises wrapping (>1 line) —
    // otherwise it can't catch the bug it's named for.
    expect(actualLines.length).toBeGreaterThan(1);
  });

  it("does NOT equal shaping the whole paragraph and then re-splitting it (the actual bug)", () => {
    const doc = new jsPDF();
    const ctx: PdfContext = { doc, isRtl: true, reportTitle: "x", pageLabel: "صفحة" };

    const longArabicText =
      "أعمل في شركتي الحالية منذ سنتين وتقديري ممتاز، وتلقيت عرضاً من شركة منافسة براتب أعلى بكثير وأنا محتار جداً من اتخاذ القرار الصحيح";
    const narrowWidth = 60;
    const fontSize = 10;

    const actualLines = measureWrappedLines(ctx, longArabicText, fontSize, narrowWidth);

    // The buggy behavior: shape first, split second.
    const buggyDoc = new jsPDF();
    buggyDoc.setFontSize(fontSize);
    const shapedWhole = shapeArabic(longArabicText);
    const buggyLines = buggyDoc.splitTextToSize(shapedWhole, narrowWidth) as string[];

    expect(actualLines).not.toEqual(buggyLines);
  });

  it("leaves non-RTL (English) text unaffected by shaping", () => {
    const doc = new jsPDF();
    const ctx: PdfContext = { doc, isRtl: false, reportTitle: "x", pageLabel: "Page" };
    const text = "This is a plain English sentence that should wrap normally across lines.";

    const lines = measureWrappedLines(ctx, text, 10, 40);
    const rawDoc = new jsPDF();
    rawDoc.setFontSize(10);
    const rawLines = rawDoc.splitTextToSize(text, 40) as string[];

    expect(lines).toEqual(rawLines);
  });
});
