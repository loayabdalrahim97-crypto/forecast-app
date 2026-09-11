"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";

const AREAS = ["career", "relationships", "finance", "business", "personal", "other"];
const AREA_LABEL: Record<string, { en: string; ar: string }> = {
  career: { en: "Career", ar: "مهنة" },
  relationships: { en: "Relationships", ar: "علاقات" },
  finance: { en: "Finance", ar: "مالية" },
  business: { en: "Business", ar: "أعمال" },
  personal: { en: "Personal", ar: "شخصي" },
  other: { en: "Other", ar: "أخرى" },
};

interface Profile {
  email: string;
  name: string | null;
  profileImage: string | null;
  occupation: string | null;
  decisionAreas: string[] | null;
}

export default function ProfilePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setProfile(data.profile);
        setName(data.profile.name ?? "");
        setOccupation(data.profile.occupation ?? "");
        setAreas(data.profile.decisionAreas ?? []);
      });
  }, [status]);

  function toggleArea(area: string) {
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, occupation: occupation || null, decisionAreas: areas }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 480, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  return (
    <DashboardShell locale={locale}>
    <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", margin: "1rem 0 1.5rem" }}>{locale === "ar" ? "الملف الشخصي" : "Profile"}</h1>

      {!profile ? (
        <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      ) : (
        <form onSubmit={handleSave}>
          {profile.profileImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profileImage}
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: "50%", marginBottom: "1rem" }}
            />
          )}

          <label htmlFor="email" className="fc-label">
            {locale === "ar" ? "البريد الإلكتروني" : "Email"}
          </label>
          <input id="email" className="fc-input" value={profile.email} disabled style={{ opacity: 0.6 }} />

          <label htmlFor="name" className="fc-label">
            {locale === "ar" ? "الاسم" : "Name"}
          </label>
          <input id="name" className="fc-input" value={name} onChange={(e) => setName(e.target.value)} />

          <label htmlFor="occupation" className="fc-label">
            {locale === "ar" ? "المهنة (اختياري)" : "Occupation (optional)"}
          </label>
          <input id="occupation" className="fc-input" value={occupation} onChange={(e) => setOccupation(e.target.value)} />

          <p className="fc-label">{locale === "ar" ? "مجالات القرار الرئيسية (اختياري)" : "Main decision areas (optional)"}</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {AREAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleArea(a)}
                className="fc-btn fc-btn-secondary"
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  background: areas.includes(a) ? "var(--fc-accent-soft)" : "transparent",
                  borderColor: areas.includes(a) ? "var(--fc-accent)" : undefined,
                }}
              >
                {locale === "ar" ? AREA_LABEL[a].ar : AREA_LABEL[a].en}
              </button>
            ))}
          </div>

          <button type="submit" className="fc-btn fc-btn-primary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : locale === "ar" ? "احفظ" : "Save"}
          </button>
          {saveStatus === "saved" && (
            <span style={{ marginInlineStart: "0.75rem", color: "var(--fc-positive)", fontSize: "0.85rem" }}>
              {locale === "ar" ? "انحفظ" : "Saved"}
            </span>
          )}
          {saveStatus === "error" && (
            <span style={{ marginInlineStart: "0.75rem", color: "var(--fc-band-high)", fontSize: "0.85rem" }}>
              {locale === "ar" ? "صار خطأ" : "Something went wrong"}
            </span>
          )}
        </form>
      )}
    </main>
    </DashboardShell>
  );
}
