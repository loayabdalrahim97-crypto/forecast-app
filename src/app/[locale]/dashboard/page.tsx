"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Decision {
  id: string;
  title: string;
  category: string | null;
  hasScenarios: boolean;
  hasOutcome: boolean;
}

interface DecisionProfile {
  ready: boolean;
  totalDecisions: number;
  totalOutcomesRecorded: number;
  minRequired: number;
  dimensions: {
    outcomeTrackingRate: { value: number; sampleSize: number } | null;
    scenarioEngagementRate: { value: number; sampleSize: number } | null;
    forecastCalibrationRate: { value: number; sampleSize: number } | null;
    assumptionAccuracyRate: { value: number; sampleSize: number } | null;
  };
}

export default function DashboardPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const { data: session, status } = useSession();
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [profile, setProfile] = useState<DecisionProfile | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/decisions")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDecisions(data?.decisions ?? []))
      .catch(() => setDecisions([]));
    fetch("/api/decision-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProfile(data?.profile ?? null))
      .catch(() => setProfile(null));
  }, [status]);

  if (status === "loading") return null;

  if (status === "unauthenticated") {
    return (
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 640, margin: "0 auto" }}>
        <p>{locale === "ar" ? "لازم تسجل دخول لأول." : "You need to sign in first."}</p>
        <a href={`/${locale}/login`} className="fc-btn fc-btn-primary">
          {locale === "ar" ? "تسجيل دخول" : "Log in"}
        </a>
      </main>
    );
  }

  const totalDecisions = decisions?.length ?? 0;
  const withOutcome = decisions?.filter((d) => d.hasOutcome).length ?? 0;

  return (
    <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 0.3rem" }}>
        {locale === "ar" ? `أهلاً، ${session?.user?.name ?? ""}` : `Welcome back${session?.user?.name ? `, ${session.user.name}` : ""}`}
      </h1>
      <p style={{ color: "var(--fc-text-secondary)", margin: "0 0 1.5rem" }}>
        {locale === "ar" ? "قرارك الشخصي محفوظ هون، وبيصير أفيد كل ما تستخدمه أكتر." : "Your personal decision workspace — it gets more useful the more you use it."}
      </p>

      <a href={`/${locale}/forecast/new`} className="fc-btn fc-btn-primary" style={{ marginBottom: "2rem", display: "inline-block" }}>
        {locale === "ar" ? "حلل موقف جديد" : "Analyze a new situation"}
      </a>

      {decisions === null ? (
        <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      ) : totalDecisions === 0 ? (
        <div className="fc-strip">
          <p style={{ margin: 0 }}>{locale === "ar" ? "لسا ما حللت أي موقف." : "You haven't analyzed a situation yet."}</p>
        </div>
      ) : (
        <>
          <div className="fc-grid-2" style={{ marginBottom: "2rem" }}>
            <div className="fc-strip">
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                {locale === "ar" ? "قرارات محللة" : "Decisions analyzed"}
              </p>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>{totalDecisions}</p>
            </div>
            <div className="fc-strip">
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                {locale === "ar" ? "نتائج مسجلة" : "Outcomes recorded"}
              </p>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>{withOutcome}</p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", margin: 0 }}>{locale === "ar" ? "أحدث القرارات" : "Recent decisions"}</h2>
            <a href={`/${locale}/decisions`} style={{ fontSize: "0.85rem", color: "var(--fc-accent)" }}>
              {locale === "ar" ? "شوف الكل" : "View all"}
            </a>
          </div>
          {decisions.slice(0, 5).map((d) => (
            <a
              key={d.id}
              href={`/${locale}/decisions/${d.id}`}
              className="fc-strip"
              style={{ display: "block", marginBottom: "0.75rem", textDecoration: "none", color: "inherit" }}
            >
              <p style={{ margin: 0, fontSize: "0.92rem" }}>{d.title}</p>
            </a>
          ))}

          <section style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--fc-border)" }}>
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>
              {locale === "ar" ? "ملف القرار الخاص فيك" : "Your Decision Profile"}
            </h2>
            {!profile ? (
              <p style={{ color: "var(--fc-text-muted)", fontSize: "0.88rem" }}>
                {locale === "ar" ? "جاري التحميل..." : "Loading..."}
              </p>
            ) : !profile.ready ? (
              <div className="fc-strip">
                <p style={{ margin: "0 0 0.4rem" }}>
                  {locale === "ar" ? "ملف القرار الخاص فيك لسا قيد التطور." : "Your decision profile is still developing."}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fc-text-muted)" }}>
                  {locale === "ar"
                    ? `فورسي بيصير أدق بتحديد أنماط قراراتك كل ما حللت مواقف أكتر وسجلت شو صار فعلاً. (${profile.totalOutcomesRecorded}/${profile.minRequired} نتائج مسجلة)`
                    : `Foresee becomes more accurate at identifying your decision patterns as you analyze more situations and record what actually happened. (${profile.totalOutcomesRecorded}/${profile.minRequired} outcomes recorded)`}
                </p>
              </div>
            ) : (
              <div className="fc-grid-2">
                {profile.dimensions.outcomeTrackingRate && (
                  <div className="fc-strip">
                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar" ? "معدل تسجيل النتائج" : "Outcome tracking rate"}
                    </p>
                    <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
                      {Math.round(profile.dimensions.outcomeTrackingRate.value * 100)}%
                    </p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar" ? `بناءً على ${profile.dimensions.outcomeTrackingRate.sampleSize} قرار` : `Based on ${profile.dimensions.outcomeTrackingRate.sampleSize} decisions`}
                    </p>
                  </div>
                )}
                {profile.dimensions.scenarioEngagementRate && (
                  <div className="fc-strip">
                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar" ? "معدل توليد السيناريوهات" : "Scenario engagement rate"}
                    </p>
                    <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
                      {Math.round(profile.dimensions.scenarioEngagementRate.value * 100)}%
                    </p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar" ? `بناءً على ${profile.dimensions.scenarioEngagementRate.sampleSize} قرار` : `Based on ${profile.dimensions.scenarioEngagementRate.sampleSize} decisions`}
                    </p>
                  </div>
                )}
                {profile.dimensions.forecastCalibrationRate && (
                  <div className="fc-strip">
                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar" ? "دقة توقع السيناريو الأرجح" : "Most-likely calibration"}
                    </p>
                    <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
                      {Math.round(profile.dimensions.forecastCalibrationRate.value * 100)}%
                    </p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar"
                        ? `بناءً على ${profile.dimensions.forecastCalibrationRate.sampleSize} نتيجة مطابقة`
                        : `Based on ${profile.dimensions.forecastCalibrationRate.sampleSize} matched outcomes`}
                    </p>
                  </div>
                )}
                {profile.dimensions.assumptionAccuracyRate && (
                  <div className="fc-strip">
                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar" ? "دقة الافتراضات الأولية" : "Initial assumption accuracy"}
                    </p>
                    <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
                      {Math.round(profile.dimensions.assumptionAccuracyRate.value * 100)}%
                    </p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--fc-text-muted)" }}>
                      {locale === "ar"
                        ? `بناءً على ${profile.dimensions.assumptionAccuracyRate.sampleSize} نتيجة`
                        : `Based on ${profile.dimensions.assumptionAccuracyRate.sampleSize} outcomes`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
