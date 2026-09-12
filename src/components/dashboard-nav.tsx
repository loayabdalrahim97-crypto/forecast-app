"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "dashboard", icon: "🏠", en: "Home", ar: "الرئيسية" },
  { href: "forecast/new", icon: "+", en: "New Forecast", ar: "توقع جديد" },
  { href: "decisions", icon: "📋", en: "My Forecasts", ar: "توقعاتي" },
  { href: "insights", icon: "💡", en: "Insights", ar: "ملاحظات" },
  { href: "behavioral-profile", icon: "🧭", en: "Behavioral Profile", ar: "الملف السلوكي" },
];

const BOTTOM_ITEMS = [
  { href: "usage", icon: "📊", en: "Usage", ar: "الاستخدام" },
  { href: "billing", icon: "💳", en: "Billing", ar: "الفوترة" },
  { href: "settings", icon: "⚙️", en: "Settings", ar: "الإعدادات" },
];

// §"Important UX rule": normal users must never see the word "Admin"
// anywhere, and never know a Management area exists. This link is
// rendered only after a real server response confirms role === "admin"
// — hiding it client-side is a UX nicety on top of the actual
// enforcement, which is the server-side check on every /admin page and
// API route (see check-admin.ts). A hidden button alone is never the
// real protection.
const MANAGEMENT_ITEM = { href: "admin", icon: "🛠️", en: "Management", ar: "الإدارة الداخلية" };


const MOBILE_ITEMS = [
  { href: "dashboard", icon: "🏠", en: "Home", ar: "الرئيسية" },
  { href: "decisions", icon: "📋", en: "Forecasts", ar: "توقعاتي" },
  { href: "insights", icon: "💡", en: "Insights", ar: "ملاحظات" },
  { href: "profile", icon: "👤", en: "Profile", ar: "ملفي" },
];

function isActive(currentPath: string, locale: string, href: string): boolean {
  return currentPath === `/${locale}/${href}` || currentPath.startsWith(`/${locale}/${href}/`);
}

/**
 * §11/§12 of the dashboard spec: a real sidebar on desktop, a bottom
 * bar on mobile — not a squeezed desktop sidebar on a small screen.
 * Wraps page content so every dashboard-area page gets consistent
 * navigation without duplicating it per page.
 */
export function DashboardShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const currentPath = usePathname() ?? "";
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIsAdmin(data?.profile?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  return (
    <div className="fc-dash-shell">
      <aside className="fc-dash-sidebar">
        <a href={`/${locale}`} style={{ display: "block", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1.5rem", color: "var(--fc-text-primary)", textDecoration: "none" }}>
          Foresee
        </a>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {ITEMS.map((item) => (
            <a
              key={item.href}
              href={`/${locale}/${item.href}`}
              className="fc-dash-nav-link"
              style={{
                background: isActive(currentPath, locale, item.href) ? "var(--fc-accent-soft)" : "transparent",
                color: isActive(currentPath, locale, item.href) ? "var(--fc-accent)" : "var(--fc-text-secondary)",
              }}
            >
              <span aria-hidden>{item.icon}</span> {locale === "ar" ? item.ar : item.en}
            </a>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {BOTTOM_ITEMS.map((item) => (
            <a
              key={item.href}
              href={`/${locale}/${item.href}`}
              className="fc-dash-nav-link"
              style={{
                background: isActive(currentPath, locale, item.href) ? "var(--fc-accent-soft)" : "transparent",
                color: isActive(currentPath, locale, item.href) ? "var(--fc-accent)" : "var(--fc-text-secondary)",
              }}
            >
              <span aria-hidden>{item.icon}</span> {locale === "ar" ? item.ar : item.en}
            </a>
          ))}
          <a href={`/${locale}/profile`} className="fc-dash-nav-link" style={{ color: "var(--fc-text-secondary)" }}>
            <span aria-hidden>👤</span> {locale === "ar" ? "ملفي" : "Profile"}
          </a>
          {isAdmin && (
            <a
              href={`/${locale}/${MANAGEMENT_ITEM.href}`}
              className="fc-dash-nav-link"
              style={{
                color: isActive(currentPath, locale, MANAGEMENT_ITEM.href) ? "var(--fc-accent)" : "var(--fc-text-secondary)",
                background: isActive(currentPath, locale, MANAGEMENT_ITEM.href) ? "var(--fc-accent-soft)" : "transparent",
              }}
            >
              <span aria-hidden>{MANAGEMENT_ITEM.icon}</span> {locale === "ar" ? MANAGEMENT_ITEM.ar : MANAGEMENT_ITEM.en}
            </a>
          )}
        </div>
      </aside>

      <div className="fc-dash-content">{children}</div>

      <nav className="fc-dash-mobile-nav">
        {MOBILE_ITEMS.map((item) => (
          <a
            key={item.href}
            href={`/${locale}/${item.href}`}
            style={{
              color: isActive(currentPath, locale, item.href) ? "var(--fc-accent)" : "var(--fc-text-muted)",
              textDecoration: "none",
              fontSize: "0.68rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.15rem",
            }}
          >
            <span aria-hidden style={{ fontSize: "1.1rem" }}>{item.icon}</span>
            {locale === "ar" ? item.ar : item.en}
          </a>
        ))}
        <a
          href={`/${locale}/forecast/new`}
          style={{ color: "var(--fc-accent)", textDecoration: "none", fontSize: "0.68rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}
        >
          <span aria-hidden style={{ fontSize: "1.1rem" }}>+</span>
          {locale === "ar" ? "جديد" : "New"}
        </a>
      </nav>
    </div>
  );
}
