"use client";

/**
 * Renders a DOM element to a paginated PDF that looks like the page
 * itself — same fonts, colors, RTL layout for Arabic — rather than
 * manually laying out text in jsPDF (which has no real Arabic/RTL
 * support without embedding a shaped font). This trades "selectable
 * text" for "guaranteed visual parity with the site," which is what
 * was asked for.
 */
export async function downloadForecastPdf(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const bgColor = getComputedStyle(document.body).getPropertyValue("--fc-bg-base").trim() || "#0a0c10";

  const canvas = await html2canvas(element, {
    backgroundColor: bgColor,
    scale: 2, // sharper output than a 1:1 screen capture
    useCORS: true,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const pxPerPdfPage = (canvas.width / imgWidth) * pageHeight;
  const totalPages = Math.max(1, Math.ceil(canvas.height / pxPerPdfPage));

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    const sliceHeightPx = Math.min(pxPerPdfPage, canvas.height - page * pxPerPdfPage);
    sliceCanvas.height = sliceHeightPx;

    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      page * pxPerPdfPage,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );

    const sliceImgHeight = (sliceHeightPx * imgWidth) / canvas.width;
    pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, sliceImgHeight);
  }

  pdf.save(filename);
}
