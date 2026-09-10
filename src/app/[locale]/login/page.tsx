"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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

    window.location.href = `/${locale}`;
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 400 }}>
      <h1>{t(locale, "nav.login")}</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" style={{ display: "block", marginBottom: "0.25rem" }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <label htmlFor="password" style={{ display: "block", marginBottom: "0.25rem" }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" disabled={status === "loading"}>
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

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "var(--fc-radius-md)",
  border: "1px solid var(--fc-border)",
  background: "var(--fc-bg-card)",
  color: "var(--fc-text-primary)",
  marginBottom: "1rem",
};
