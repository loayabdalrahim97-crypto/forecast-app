"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { LOCALE_DISPLAY_NAMES } from "@/lib/i18n/display-names";

interface Profile {
  email: string;
  name: string | null;
  preferredLanguage: string;
  timezone: string | null;
}

export default function SettingsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState("en-us");
  const [timezone, setTimezone] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting">("idle");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setProfile(data.profile);
        setPreferredLanguage(data.profile.preferredLanguage ?? "en-us");
        setTimezone(data.profile.timezone ?? "");
      });
  }, [status]);

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage, timezone: timezone || null }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleDeleteAccount() {
    if (deleteStatus !== "confirming") {
      setDeleteStatus("confirming");
      return;
    }
    setDeleteStatus("deleting");
    const res = await fetch("/api/profile", { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      await signOut({ callbackUrl: `/${locale}` });
    } else {
      setDeleteStatus("idle");
    }
  }

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  return (
    <DashboardShell locale={locale}>
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 1.5rem" }}>{locale === "ar" ? "الإعدادات" : "Settings"}</h1>

        {!profile ? (
          <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        ) : (
          <>
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "الحساب" : "Account"}</h2>
              <p style={{ fontSize: "0.9rem", margin: "0 0 0.3rem" }}>
                <strong>{locale === "ar" ? "الاسم:" : "Name:"}</strong> {profile.name ?? "—"}
              </p>
              <p style={{ fontSize: "0.9rem", margin: "0 0 0.75rem" }}>
                <strong>{locale === "ar" ? "الإيميل:" : "Email:"}</strong> {profile.email}
              </p>
              <a href={`/${locale}/profile`} style={{ fontSize: "0.82rem", color: "var(--fc-accent)" }}>
                {locale === "ar" ? "عدّل الملف الشخصي ←" : "Edit profile →"}
              </a>
            </section>

            <section style={{ marginBottom: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "التفضيلات" : "Preferences"}</h2>
              <form onSubmit={handleSavePreferences}>
                <label htmlFor="lang" className="fc-label">{locale === "ar" ? "اللغة" : "Language"}</label>
                <select id="lang" className="fc-input" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
                  {SUPPORTED_LOCALES.map((l) => (
                    <option key={l} value={l}>{LOCALE_DISPLAY_NAMES[l]}</option>
                  ))}
                </select>

                <label htmlFor="tz" className="fc-label">{locale === "ar" ? "المنطقة الزمنية (اختياري)" : "Timezone (optional)"}</label>
                <input id="tz" className="fc-input" placeholder="e.g. Asia/Amman" value={timezone} onChange={(e) => setTimezone(e.target.value)} />

                <button type="submit" className="fc-btn fc-btn-primary" disabled={saveStatus === "saving"}>
                  {saveStatus === "saving" ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : locale === "ar" ? "احفظ" : "Save"}
                </button>
                {saveStatus === "saved" && (
                  <span style={{ marginInlineStart: "0.75rem", color: "var(--fc-positive)", fontSize: "0.85rem" }}>
                    {locale === "ar" ? "انحفظ" : "Saved"}
                  </span>
                )}
              </form>
            </section>

            <section style={{ marginBottom: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "الخصوصية" : "Privacy"}</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--fc-text-secondary)", margin: "0 0 0.75rem" }}>
                {locale === "ar"
                  ? "تقدر تحذف أي توقع لحاله من صفحة \"توقعاتي\" — افتح التوقع ودوس \"احذف\"."
                  : 'You can delete any individual forecast from "My Forecasts" — open it and press "Delete".'}
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="fc-btn fc-btn-secondary"
                style={{ color: "var(--fc-band-high)", borderColor: "var(--fc-band-high)", fontSize: "0.85rem" }}
                disabled={deleteStatus === "deleting"}
              >
                {deleteStatus === "confirming"
                  ? locale === "ar" ? "تأكيد حذف الحساب؟" : "Confirm delete account?"
                  : deleteStatus === "deleting"
                    ? locale === "ar" ? "جاري الحذف..." : "Deleting..."
                    : locale === "ar" ? "احذف حسابي" : "Delete my account"}
              </button>
            </section>

            <section style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
              <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>{locale === "ar" ? "الأمان" : "Security"}</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
                {locale === "ar"
                  ? "تغيير كلمة السر غير مدعوم بعد — سيتوفر في مرحلة قادمة."
                  : "Password change isn't supported yet — coming in a later phase."}
              </p>
            </section>
          </>
        )}
      </main>
    </DashboardShell>
  );
}
