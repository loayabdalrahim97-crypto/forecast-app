"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleSignInButton } from "@/components/google-signin-button";
import enUs from "../../../../messages/en-us.json";
import ar from "../../../../messages/ar.json";

const MESSAGES: Record<string, typeof enUs> = { "en-us": enUs, ar };

function t(locale: string, path: string): string {
  const dict = MESSAGES[locale] ?? enUs;
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : path;
}

export default function LoginPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setStatus("error");
      return;
    }

    window.location.href = `/${locale}/dashboard`;
  }

  return (
    <main style={{ padding: "2.5rem 2rem", maxWidth: 400, margin: "0 auto" }}>
      <h1>{t(locale, "nav.login")}</h1>
      <GoogleSignInButton locale={locale} callbackUrl={`/${locale}/dashboard`} />
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" className="fc-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="fc-input"
        />
        <label htmlFor="password" className="fc-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="fc-input"
        />
        <button type="submit" className="fc-btn fc-btn-primary" disabled={status === "loading"} style={{ marginTop: "0.25rem" }}>
          {t(locale, "nav.login")}
        </button>
      </form>
      {status === "error" && (
        <p style={{ color: "var(--fc-band-high)" }}>{t(locale, "errors.generic")}</p>
      )}
      <p style={{ marginTop: "1rem" }}>
        <a href={`/${locale}/signup`} style={{ color: "var(--fc-accent)" }}>
          {t(locale, "nav.signup")}
        </a>
      </p>
    </main>
  );
}


