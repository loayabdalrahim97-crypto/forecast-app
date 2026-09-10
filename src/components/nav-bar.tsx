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
  fontSize: "0.9rem",
};

export function NavBar({ locale }: { locale: string }) {
  const { data: session, status } = useSession();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid var(--fc-border)",
      }}
    >
      <a href={`/${locale}`} style={{ color: "var(--fc-text-primary)", textDecoration: "none", fontWeight: "bold" }}>
        FORECAST
      </a>
      <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
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
              style={{ background: "none", border: "none", color: "var(--fc-text-secondary)", cursor: "pointer" }}
            >
              {t(locale, "nav.login") === "Log in" ? "Log out" : "تسجيل خروج"}
            </button>
          </>
        ) : status === "loading" ? null : (
          <>
            <a href={`/${locale}/login`} style={linkStyle}>
              {t(locale, "nav.login")}
            </a>
            <a href={`/${locale}/signup`} style={linkStyle}>
              {t(locale, "nav.signup")}
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
