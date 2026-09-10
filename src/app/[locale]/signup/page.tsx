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

export default function SignupPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMessage(data.error ?? t(locale, "errors.generic"));
      setStatus("error");
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      setErrorMessage(t(locale, "errors.generic"));
      setStatus("error");
      return;
    }

    window.location.href = `/${locale}/onboarding`;
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 400 }}>
      <h1>{t(locale, "nav.signup")}</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name" style={{ display: "block", marginBottom: "0.25rem" }}>
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" disabled={status === "loading"}>
          {t(locale, "nav.signup")}
        </button>
      </form>
      {status === "error" && errorMessage && (
        <p style={{ color: "var(--fc-band-high)" }}>{errorMessage}</p>
      )}
      <p style={{ marginTop: "1rem" }}>
        <a href={`/${locale}/login`} style={{ color: "var(--fc-accent)" }}>
          {t(locale, "nav.login")}
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
