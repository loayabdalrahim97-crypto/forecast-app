"use client";

/**
 * Renders an HTML string to a paginated A4 PDF by actually rendering
 * it in the browser and capturing it — the browser's own text engine
 * handles Arabic shaping/bidi correctly (it's the same engine that
 * renders every Arabic page on this site), which manual PDF text
 * shaping (jsPDF + a shaping library) did not do correctly in testing.
 */
export async function renderHtmlToPdf(html: string, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  // Rendered inside a zero-size, overflow-hidden wrapper with
  // visibility:hidden rather than the previous position:fixed;
  // left:-99999px. The huge negative offset is the more likely cause
  // of the scale>1 ghosting than scale itself: html2canvas clones the
  // node into an internal iframe sized off the *cloned* element's
  // position, and an off-screen coordinate that large is a known
  // trigger for that clone/iframe math to misalign at higher pixel
  // ratios. Kept in normal flow (not display:none, which drops
  // layout) so it never touches the visible page.
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.width = "0";
  wrapper.style.height = "0";
  wrapper.style.overflow = "hidden";
  wrapper.style.visibility = "hidden";
  wrapper.style.pointerEvents = "none";

  const container = document.createElement("div");
  container.innerHTML = html;
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  try {
    // Wait for every web font (including the Arabic font, which may
    // still be swapping in from its "loading" placeholder) to finish
    // loading before capturing — capturing mid-swap is a well-known
    // cause of inconsistent/garbled glyph shaping in canvas-rendered
    // text, especially for connected scripts like Arabic.
    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.ready;
    }

    const target = container.firstElementChild as HTMLElement;

    // Before capturing, record the pixel range (relative to the top of
    // the report) of every block the template marked data-keep="1" —
    // headings paired with their paragraph, each scenario card row,
    // the facts/assumptions/unknowns row. Page breaks are computed
    // purely by pixel height below, with no awareness of where a
    // sentence or card actually ends; without this, a break could
    // (and, confirmed against a real exported report, did) land in
    // the middle of a paragraph or card.
    const targetTop = target.getBoundingClientRect().top;
    const keepRanges = Array.from(target.querySelectorAll<HTMLElement>("[data-keep]")).map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - targetTop, bottom: r.bottom - targetTop };
    });

    // scale:2 for a sharp export (roughly 180 DPI on an A4 page, vs.
    // ~90 DPI at scale:1 — the difference the low-quality report was
    // reported against). The ghosting seen previously at scale>1 is
    // addressed above by removing the extreme off-screen offset, and
    // further guarded here by pinning explicit width/height so
    // html2canvas's internal clone can't compute a mismatched capture
    // box at the higher pixel ratio.
    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      width: target.scrollWidth,
      height: target.scrollHeight,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const pxPerPdfPage = (canvas.width / imgWidth) * pageHeight;

    // Nudge a candidate page-break position earlier if it would land
    // inside a keep-together block, so the break falls in the gap
    // before that block instead of through it. If a single block is
    // taller than a whole page (no earlier break point exists), fall
    // back to the raw position rather than looping forever.
    function adjustBreak(candidate: number, pageStart: number): number {
      const hit = keepRanges.find((r) => r.top < candidate && r.bottom > candidate);
      if (!hit) return candidate;
      return hit.top > pageStart ? hit.top : candidate;
    }

    let cursor = 0;
    let page = 0;
    while (cursor < canvas.height) {
      if (page > 0) pdf.addPage();

      const rawEnd = Math.min(cursor + pxPerPdfPage, canvas.height);
      const sliceEnd = rawEnd >= canvas.height ? rawEnd : adjustBreak(rawEnd, cursor);
      const sliceHeightPx = sliceEnd - cursor;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;

      const ctx = sliceCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, cursor, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

        const sliceImgHeight = (sliceHeightPx * imgWidth) / canvas.width;
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, sliceImgHeight);
      }

      cursor = sliceEnd;
      page += 1;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}
