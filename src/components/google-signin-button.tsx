"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

export function GoogleSignInButton({ locale, callbackUrl }: { locale: string; callbackUrl: string }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    getProviders().then((providers) => {
      if (providers?.google) setAvailable(true);
    });
  }, []);

  if (!available) return null;

  return (
    <>
      <button
        type="button"
        className="fc-btn fc-btn-secondary"
        style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}
        onClick={() => signIn("google", { callbackUrl })}
      >
        {locale === "ar" ? "المتابعة عبر Google" : "Continue with Google"}
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          margin: "0 0 1rem",
          color: "var(--fc-text-muted)",
          fontSize: "0.8rem",
        }}
      >
        <span style={{ flex: 1, height: 1, background: "var(--fc-border)" }} />
        {locale === "ar" ? "أو" : "or"}
        <span style={{ flex: 1, height: 1, background: "var(--fc-border)" }} />
      </div>
    </>
  );
}
