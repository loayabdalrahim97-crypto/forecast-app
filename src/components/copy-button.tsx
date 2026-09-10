"use client";

import { useState } from "react";

export function CopyButton({ text, locale }: { text: string; locale: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail
      // silently rather than showing an error for a non-critical action.
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={handleCopy}
        className="fc-btn fc-btn-secondary"
        style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}
      >
        {locale === "ar" ? "نسخ" : "Copy Response"}
      </button>
      {copied && (
        <span style={{ fontSize: "0.75rem", color: "var(--fc-band-low)" }}>
          {locale === "ar" ? "تم نسخ الرد" : "Response copied to clipboard"}
        </span>
      )}
    </span>
  );
}
