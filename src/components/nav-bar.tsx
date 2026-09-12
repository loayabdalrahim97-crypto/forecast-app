"use client";

import { useSession, signOut } from "next-auth/react";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { t } from "@/lib/i18n/messages";

const linkStyle = {
  color: "var(--fc-text-secondary)",
  textDecoration: "none",
  fontSize: "0.88rem",
};

export function NavBar({ locale }: { locale: string }) {
  const { data: session, status } = useSession();

  return (
    <nav className="fc-nav">
      <a
        href={`/${locale}`}
        style={{
          color: "var(--fc-text-primary)",
          textDecoration: "none",
          fontFamily: "var(--fc-font-heading)",
          fontWeight: 600,
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <Logo size={30} className="fc-logo-mark" />
        Foresee
      </a>
      <div className="fc-nav-links">
        <LanguageSwitcher locale={locale} />
        <a href={`/${locale}/forecast/new`} style={linkStyle}>
          {t(locale, "hero.ctaPrimary")}
        </a>
        <a href={`/${locale}/onboarding`} style={linkStyle}>
          {t(locale, "onboarding.title")}
        </a>
        <a href={`/${locale}/pricing`} style={linkStyle}>
          {t(locale, "nav.pricing")}
        </a>
        {status === "authenticated" ? (
          <>
            <a href={`/${locale}/dashboard`} style={linkStyle}>
              {locale === "ar" ? "لوحتي" : "Dashboard"}
            </a>
            <span
              className="fc-nav-email"
              style={{
                ...linkStyle,
                color: "var(--fc-text-muted)",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="fc-btn fc-btn-secondary"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", minHeight: "auto" }}
            >
              {t(locale, "nav.login") === "Log in" ? "Log out" : "تسجيل خروج"}
            </button>
          </>
        ) : status === "loading" ? null : (
          <>
            <a href={`/${locale}/login`} style={linkStyle}>
              {t(locale, "nav.login")}
            </a>
            <a
              href={`/${locale}/signup`}
              className="fc-btn fc-btn-primary"
              style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem", minHeight: "auto" }}
            >
              {t(locale, "nav.signup")}
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
