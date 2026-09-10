"use client";

import { useState, type RefObject } from "react";
import { downloadForecastPdf } from "@/lib/pdf/download-forecast-pdf";

export function DownloadPdfButton({
  targetRef,
  filename,
  locale,
}: {
  targetRef: RefObject<HTMLElement>;
  filename: string;
  locale: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    if (!targetRef.current) return;
    setStatus("loading");
    try {
      await downloadForecastPdf(targetRef.current, filename);
      setStatus("idle");
    } catch (err) {
      console.error("[pdf] export failed:", err);
      setStatus("error");
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="fc-btn fc-btn-secondary"
        style={{ fontSize: "0.82rem" }}
      >
        {status === "loading"
          ? locale === "ar"
            ? "جاري التحضير..."
            : "Preparing PDF..."
          : locale === "ar"
            ? "تنزيل PDF"
            : "Download PDF"}
      </button>
      {status === "error" && (
        <span style={{ fontSize: "0.78rem", color: "var(--fc-band-high)" }}>
          {locale === "ar" ? "فشل التنزيل، حاول مرة أخرى" : "Download failed, try again"}
        </span>
      )}
    </span>
  );
}
