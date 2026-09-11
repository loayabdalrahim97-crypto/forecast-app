import type { jsPDF } from "jspdf";

// A4 in mm, with generous margins for a "premium report" feel rather
// than a cramped screen-to-paper dump.
export const PAGE = { width: 210, height: 297 };
export const MARGIN = { top: 22, bottom: 18, left: 18, right: 18 };
export const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

// English-only module. Arabic report generation uses a completely
// separate path (arabic-report-html.ts + html-to-pdf.ts) that renders
// real HTML and captures it, because manual PDF text shaping here
// (jsPDF + a bidi/shaping library) produced visibly disconnected,
// unjoined Arabic letters when checked by rasterizing an actual
// generated PDF and reading it closely — confirmed as a real defect,
// not a text-extraction artifact. `isRtl` is kept on PdfContext only
// so this module's shape doesn't need to change if a text-based RTL
// approach is revisited later; every call site here now always passes
// isRtl: false.
export interface PdfContext {
  doc: jsPDF;
  isRtl: boolean;
  reportTitle: string;
  pageLabel: string;
}

function startX(ctx: PdfContext): number {
  return ctx.isRtl ? PAGE.width - MARGIN.right : MARGIN.left;
}

function align(ctx: PdfContext): "left" | "right" {
  return ctx.isRtl ? "right" : "left";
}

export function setFont(ctx: PdfContext, weight: "normal" | "bold") {
  ctx.doc.setFont("helvetica", weight);
}

export function addHeaderFooter(ctx: PdfContext, pageNumber: number) {
  const { doc } = ctx;
  doc.setFontSize(9);
  setFont(ctx, "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(ctx.reportTitle, startX(ctx), 12, { align: align(ctx) });
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN.left, 16, PAGE.width - MARGIN.right, 16);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${ctx.pageLabel} ${pageNumber}`, PAGE.width / 2, PAGE.height - 10, { align: "center" });
  doc.setTextColor(20, 20, 20);
}

/** Adds a new page and redraws the header/footer chrome. Returns the Y to start content at. */
export function newPage(ctx: PdfContext, pageNumber: number): number {
  ctx.doc.addPage();
  addHeaderFooter(ctx, pageNumber);
  return MARGIN.top;
}

/**
 * The core anti-orphan rule (no heading separated from its content, no
 * card split badly): before drawing a block of known height, check
 * whether it fits in the remaining space on the current page; if not,
 * start a fresh page first.
 */
export function ensureSpace(
  ctx: PdfContext,
  y: number,
  neededHeight: number,
  pageNumber: number
): { y: number; pageNumber: number } {
  if (y + neededHeight > PAGE.height - MARGIN.bottom) {
    const nextPage = pageNumber + 1;
    return { y: newPage(ctx, nextPage), pageNumber: nextPage };
  }
  return { y, pageNumber };
}

export function measureWrappedLines(ctx: PdfContext, text: string, fontSize: number, maxWidth: number): string[] {
  ctx.doc.setFontSize(fontSize);
  return ctx.doc.splitTextToSize(text, maxWidth) as string[];
}

/** Draws a section heading (e.g. "Known Facts"). Returns the new Y. */
export function drawHeading(ctx: PdfContext, text: string, y: number, size = 14): number {
  const { doc } = ctx;
  setFont(ctx, "bold");
  doc.setFontSize(size);
  doc.setTextColor(20, 60, 55); // dark teal, echoes the site's signal-teal accent on a print-friendly light page
  doc.text(text, startX(ctx), y, { align: align(ctx) });
  doc.setTextColor(20, 20, 20);
  return y + size * 0.5 + 3;
}

export function measureHeadingHeight(size = 14): number {
  return size * 0.5 + 3;
}

/** Draws a wrapped paragraph, returns new Y. */
export function drawParagraph(
  ctx: PdfContext,
  text: string,
  y: number,
  opts: { fontSize?: number; bold?: boolean; maxWidth?: number; color?: [number, number, number] } = {}
): number {
  const { doc } = ctx;
  const fontSize = opts.fontSize ?? 10.5;
  const maxWidth = opts.maxWidth ?? CONTENT_WIDTH;
  setFont(ctx, opts.bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  if (opts.color) doc.setTextColor(...opts.color);
  const lines = measureWrappedLines(ctx, text, fontSize, maxWidth);
  const lineHeight = fontSize * 0.42;
  doc.text(lines, startX(ctx), y, { align: align(ctx) });
  if (opts.color) doc.setTextColor(20, 20, 20);
  return y + lines.length * lineHeight + 2;
}

export function measureParagraphHeight(ctx: PdfContext, text: string, fontSize = 10.5, maxWidth = CONTENT_WIDTH): number {
  const lines = measureWrappedLines(ctx, text, fontSize, maxWidth);
  return lines.length * (fontSize * 0.42) + 2;
}

/** Draws a bulleted list, returns new Y. */
export function drawBulletList(ctx: PdfContext, items: string[], y: number, fontSize = 10): number {
  const { doc } = ctx;
  setFont(ctx, "normal");
  doc.setFontSize(fontSize);
  let cursorY = y;
  const bulletWidth = 5;
  const textMaxWidth = CONTENT_WIDTH - bulletWidth;
  for (const item of items) {
    const lines = measureWrappedLines(ctx, item, fontSize, textMaxWidth);
    const lineHeight = fontSize * 0.42;
    const bulletX = ctx.isRtl ? PAGE.width - MARGIN.right : MARGIN.left;
    const textX = ctx.isRtl ? bulletX - bulletWidth : bulletX + bulletWidth;
    doc.text("•", bulletX, cursorY, { align: align(ctx) });
    doc.text(lines, textX, cursorY, { align: align(ctx) });
    cursorY += lines.length * lineHeight + 1.5;
  }
  return cursorY + 2;
}

export function measureBulletListHeight(ctx: PdfContext, items: string[], fontSize = 10): number {
  const bulletWidth = 5;
  const textMaxWidth = CONTENT_WIDTH - bulletWidth;
  let h = 2;
  for (const item of items) {
    const lines = measureWrappedLines(ctx, item, fontSize, textMaxWidth);
    h += lines.length * (fontSize * 0.42) + 1.5;
  }
  return h;
}

/** A light divider line. */
export function drawDivider(ctx: PdfContext, y: number): number {
  ctx.doc.setDrawColor(225, 225, 225);
  ctx.doc.line(MARGIN.left, y, PAGE.width - MARGIN.right, y);
  return y + 5;
}

/** Band color for likelihood/confidence/impact values, matching the site's palette. */
export function bandColor(band: string): [number, number, number] {
  const v = band.toLowerCase();
  if (v === "high") return [200, 80, 65];
  if (v === "low") return [90, 150, 115];
  return [200, 150, 60]; // moderate
}
