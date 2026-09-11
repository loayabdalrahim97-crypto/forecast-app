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

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-99999px"; // off-screen, not display:none (html2canvas needs real layout)
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const target = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      windowWidth: target.scrollWidth,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
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
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, page * pxPerPdfPage, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      const sliceImgHeight = (sliceHeightPx * imgWidth) / canvas.width;
      pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, sliceImgHeight);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
