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

// ---- Compact / visual layout primitives (2-page condensed report) ----
// These mirror the site's own visual language (3-segment band gauges,
// side-by-side comparison) instead of prose paragraphs, so the PDF
// conveys the same information in far less reading time — the same
// data, a denser presentation, not less content.

const BAND_ORDER = ["low", "moderate", "high"];

/** A small 3-segment horizontal gauge, e.g. site's BandGauge but drawn in jsPDF. Returns new Y. */
export function drawMiniGauge(
  ctx: PdfContext,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string
): number {
  const { doc } = ctx;
  const band = value.toLowerCase();
  const activeIndex = Math.max(0, BAND_ORDER.indexOf(band));
  const color = bandColor(value);

  setFont(ctx, "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text(label, x, y, { align: "left" });
  doc.setTextColor(...color);
  doc.text(value, x + width, y, { align: "right" });
  doc.setTextColor(20, 20, 20);

  const barY = y + 1.2;
  const segGap = 0.6;
  const segWidth = (width - segGap * 2) / 3;
  for (let i = 0; i < 3; i++) {
    doc.setFillColor(...(i <= activeIndex ? color : ([225, 225, 225] as [number, number, number])));
    doc.rect(x + i * (segWidth + segGap), barY, segWidth, 1.3, "F");
  }
  return barY + 1.3 + 2;
}

export function measureMiniGaugeHeight(): number {
  return 1.2 + 1.3 + 2;
}

/**
 * A compact scenario card (title + 1-2 line description + 2 mini
 * gauges + 1-line recommended response) meant to sit side-by-side with
 * its siblings, replacing a full prose page per scenario. Returns the
 * Y position at the bottom of this card (caller takes the max across
 * all cards in the row before continuing).
 */
export function drawCompactScenarioCard(
  ctx: PdfContext,
  x: number,
  width: number,
  y: number,
  card: { badge: string; title: string; description: string; impact: string; confidence: string; response: string | null },
  accentColor: [number, number, number]
): number {
  const { doc } = ctx;
  let cy = y;

  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.8);
  doc.line(x, cy, x + width, cy);
  cy += 3;

  setFont(ctx, "bold");
  doc.setFontSize(7);
  doc.setTextColor(...accentColor);
  doc.text(card.badge.toUpperCase(), x, cy, { align: "left" });
  cy += 3.5;

  setFont(ctx, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(card.title, width) as string[];
  doc.text(titleLines.slice(0, 2), x, cy, { align: "left" });
  cy += titleLines.slice(0, 2).length * 3.8 + 1.5;

  setFont(ctx, "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(100, 100, 100);
  const descLines = (doc.splitTextToSize(card.description, width) as string[]).slice(0, 3);
  doc.text(descLines, x, cy, { align: "left" });
  cy += descLines.length * 3.3 + 2.5;

  cy = drawMiniGauge(ctx, x, cy, width, "IMPACT", card.impact);
  cy = drawMiniGauge(ctx, x, cy, width, "CONFIDENCE", card.confidence);
  cy += 1;

  if (card.response) {
    setFont(ctx, "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(20, 60, 55);
    const respLines = (doc.splitTextToSize(card.response, width) as string[]).slice(0, 4);
    doc.text(respLines, x, cy, { align: "left" });
    cy += respLines.length * 3.1;
  }

  doc.setTextColor(20, 20, 20);
  return cy;
}

/** Estimated height for a compact scenario card — used to reserve space before drawing all three. */
export function estimateCompactScenarioCardHeight(ctx: PdfContext, card: { title: string; description: string; response: string | null }, width: number): number {
  const titleLines = Math.min(2, measureWrappedLines(ctx, card.title, 9.5, width).length);
  const descLines = Math.min(3, measureWrappedLines(ctx, card.description, 7.8, width).length);
  const respLines = card.response ? Math.min(4, measureWrappedLines(ctx, card.response, 7.2, width).length) : 0;
  return 3 + 3.5 + titleLines * 3.8 + 1.5 + descLines * 3.3 + 2.5 + measureMiniGaugeHeight() * 2 + 1 + respLines * 3.1;
}

/** A 2-segment proportional bar (e.g. Reality Check: solid facts % vs assumptions/unknowns %). Returns new Y. */
export function drawProportionBar(
  ctx: PdfContext,
  y: number,
  leftPct: number,
  leftLabel: string,
  rightLabel: string
): number {
  const { doc } = ctx;
  setFont(ctx, "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(leftLabel, MARGIN.left, y, { align: "left" });
  doc.text(rightLabel, PAGE.width - MARGIN.right, y, { align: "right" });
  doc.setTextColor(20, 20, 20);

  const barY = y + 1.5;
  const barHeight = 2.2;
  const leftWidth = (CONTENT_WIDTH * leftPct) / 100;
  doc.setFillColor(76, 175, 125); // matches the site's --fc-positive
  doc.rect(MARGIN.left, barY, leftWidth, barHeight, "F");
  doc.setFillColor(219, 165, 73); // matches the site's --fc-band-moderate
  doc.rect(MARGIN.left + leftWidth, barY, CONTENT_WIDTH - leftWidth, barHeight, "F");

  return barY + barHeight + 3;
}

/**
 * N columns of (heading + bullets) side by side — e.g. Facts /
 * Assumptions / Unknowns sharing one row instead of three stacked
 * full-width sections. Returns the Y below the tallest column.
 */
export function drawColumns(
  ctx: PdfContext,
  y: number,
  columns: { heading: string; items: string[]; accentColor?: [number, number, number] }[],
  gap = 6
): number {
  const colWidth = (CONTENT_WIDTH - gap * (columns.length - 1)) / columns.length;
  let maxBottom = y;
  columns.forEach((col, i) => {
    const x = MARGIN.left + i * (colWidth + gap);
    let cy = y;
    setFont(ctx, "bold");
    ctx.doc.setFontSize(9);
    ctx.doc.setTextColor(...(col.accentColor ?? [20, 60, 55]));
    ctx.doc.text(col.heading, x, cy, { align: "left" });
    ctx.doc.setTextColor(20, 20, 20);
    cy += 4.5;

    setFont(ctx, "normal");
    ctx.doc.setFontSize(8);
    for (const item of col.items) {
      const lines = ctx.doc.splitTextToSize(item, colWidth - 3) as string[];
      ctx.doc.text("•", x, cy, { align: "left" });
      ctx.doc.text(lines, x + 3, cy, { align: "left" });
      cy += lines.length * 3.4 + 1;
    }
    maxBottom = Math.max(maxBottom, cy);
  });
  return maxBottom + 2;
}

export function measureColumnsHeight(
  ctx: PdfContext,
  columns: { heading: string; items: string[] }[],
  gap = 6
): number {
  const colWidth = (CONTENT_WIDTH - gap * (columns.length - 1)) / columns.length;
  let maxHeight = 0;
  for (const col of columns) {
    let h = 4.5;
    for (const item of col.items) {
      const lines = measureWrappedLines(ctx, item, 8, colWidth - 3);
      h += lines.length * 3.4 + 1;
    }
    maxHeight = Math.max(maxHeight, h);
  }
  return maxHeight + 2;
}
