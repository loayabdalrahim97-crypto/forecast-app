"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard-nav";

interface Profile {
  decisionStyle: string | null;
  riskTolerance: string | null;
  conflictStyle: string | null;
  communicationStyle: string | null;
  uncertaintyTolerance: string | null;
  planningStyle: string | null;
  decisionSpeed: string | null;
  adaptability: string | null;
  pressureResponse: string | null;
  riskSensitivity: string | null;
  needForCertainty: string | null;
}

const FIELD_LABEL: Record<keyof Profile, { en: string; ar: string }> = {
  decisionStyle: { en: "Decision style", ar: "أسلوب اتخاذ القرار" },
  riskTolerance: { en: "Risk tolerance", ar: "تقبل المخاطرة" },
  conflictStyle: { en: "Conflict response", ar: "التعامل مع الخلاف" },
  communicationStyle: { en: "Communication style", ar: "أسلوب التواصل" },
  uncertaintyTolerance: { en: "Uncertainty tolerance", ar: "تقبل عدم اليقين" },
  planningStyle: { en: "Planning style", ar: "أسلوب التخطيط" },
  decisionSpeed: { en: "Decision speed", ar: "سرعة اتخاذ القرار" },
  adaptability: { en: "Adaptability", ar: "المرونة" },
  pressureResponse: { en: "Response under pressure", ar: "التعامل مع الضغط" },
  riskSensitivity: { en: "Risk sensitivity", ar: "الحساسية للمخاطرة" },
  needForCertainty: { en: "Need for certainty", ar: "الحاجة لليقين" },
};

export default function BehavioralProfilePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { status } = useSession();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/behavioral-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProfile(data?.profile ?? null))
      .catch(() => setProfile(null));
  }, [status]);

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
      </main>
    );
  }

  const filledFields = profile
    ? (Object.keys(FIELD_LABEL) as (keyof Profile)[]).filter((k) => profile[k])
    : [];

  return (
    <DashboardShell locale={locale}>
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1rem 0 0.5rem" }}>
          <h1 style={{ fontSize: "1.6rem", margin: 0 }}>{locale === "ar" ? "ملفي السلوكي" : "My Behavioral Profile"}</h1>
          <a href={`/${locale}/onboarding`} className="fc-btn fc-btn-secondary" style={{ fontSize: "0.8rem" }}>
            {locale === "ar" ? "حدّث الملف" : "Update Profile"}
          </a>
        </div>
        <p style={{ color: "var(--fc-text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          {locale === "ar"
            ? "ميول سلوكية عامة بتساعد فورسي يخصص السيناريوهات — مش تشخيص نفسي."
            : "General behavioral tendencies that help Foresee tailor scenarios — not a psychological diagnosis."}
        </p>

        {profile === undefined ? (
          <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        ) : !profile || filledFields.length === 0 ? (
          <div className="fc-strip">
            <p style={{ margin: "0 0 0.75rem" }}>
              {locale === "ar" ? "لسا ما عبيت الملف السلوكي." : "You haven't filled out your behavioral profile yet."}
            </p>
            <a href={`/${locale}/onboarding`} className="fc-btn fc-btn-primary">
              {locale === "ar" ? "ابدأ" : "Get Started"}
            </a>
          </div>
        ) : (
          <div className="fc-grid-2">
            {filledFields.map((key) => (
              <div key={key} className="fc-strip">
                <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                  {locale === "ar" ? FIELD_LABEL[key].ar : FIELD_LABEL[key].en}
                </p>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, textTransform: "capitalize" }}>{profile[key]}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
