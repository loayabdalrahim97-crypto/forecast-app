"use client";

import { useSession, signOut } from "next-auth/react";
import enUs from "../../messages/en-us.json";
import ar from "../../messages/ar.json";

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

const linkStyle = {
  color: "var(--fc-text-secondary)",
  textDecoration: "none",
  fontSize: "0.88rem",
};

export function NavBar({ locale }: { locale: string }) {
  const { data: session, status } = useSession();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.1rem 2rem",
        borderBottom: "1px solid var(--fc-border)",
      }}
    >
      <a
        href={`/${locale}`}
        style={{
          color: "var(--fc-text-primary)",
          textDecoration: "none",
          fontFamily: "var(--fc-font-heading)",
          fontWeight: 600,
          fontSize: "1.05rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--fc-accent)",
            boxShadow: "0 0 0 3px var(--fc-accent-soft)",
          }}
        />
        FORECAST
      </a>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <a href={`/${locale}/forecast/new`} style={linkStyle}>
          {t(locale, "hero.ctaPrimary")}
        </a>
        <a href={`/${locale}/onboarding`} style={linkStyle}>
          {t(locale, "onboarding.title")}
        </a>
        {status === "authenticated" ? (
          <>
            <span style={{ ...linkStyle, color: "var(--fc-text-muted)" }}>{session.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="fc-btn fc-btn-secondary"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem" }}
            >
              {t(locale, "nav.login") === "Log in" ? "Log out" : "تسجيل خروج"}
            </button>
          </>
        ) : status === "loading" ? null : (
          <>
            <a href={`/${locale}/login`} style={linkStyle}>
              {t(locale, "nav.login")}
            </a>
            <a href={`/${locale}/signup`} className="fc-btn fc-btn-primary" style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}>
              {t(locale, "nav.signup")}
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
