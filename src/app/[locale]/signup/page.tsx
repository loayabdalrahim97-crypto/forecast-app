"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { t } from "@/lib/i18n/messages";

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
    <main style={{ padding: "2.5rem 2rem", maxWidth: 400, margin: "0 auto" }}>
      <h1>{t(locale, "nav.signup")}</h1>
      <GoogleSignInButton locale={locale} callbackUrl={`/${locale}/onboarding`} />
      <form onSubmit={handleSubmit}>
        <label htmlFor="name" className="fc-label">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="fc-input"
        />
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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="fc-input"
        />
        <button type="submit" className="fc-btn fc-btn-primary" disabled={status === "loading"} style={{ marginTop: "0.25rem" }}>
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


