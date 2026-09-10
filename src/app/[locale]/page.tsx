import { BandGauge } from "@/components/band-gauge";
import enUs from "../../../messages/en-us.json";
import ar from "../../../messages/ar.json";

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

export default function LocaleHome({ params: { locale } }: { params: { locale: string } }) {
  const isRtlLocale = locale === "ar";

  return (
    <main style={{ padding: "3.5rem 2rem 4rem", maxWidth: 980, margin: "0 auto" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "2.5rem",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.4rem", margin: "0 0 0.75rem" }}>{t(locale, "hero.title")}</h1>
          <p
            style={{
              color: "var(--fc-accent)",
              fontFamily: "var(--fc-font-heading)",
              fontWeight: 500,
              margin: "0 0 1rem",
            }}
          >
            {t(locale, "hero.subtitle")}
          </p>
          <p style={{ color: "var(--fc-text-secondary)", maxWidth: 440, lineHeight: 1.6, margin: "0 0 1.75rem" }}>
            {t(locale, "hero.tagline")}
          </p>
          <a href={`/${locale}/forecast/new`} className="fc-btn fc-btn-primary" style={{ fontSize: "0.95rem" }}>
            {t(locale, "hero.ctaPrimary")}
          </a>
        </div>

        {/* The hero visual is a real example of the product's output —
            a scenario card, not a decorative icon grid — so the first
            thing a visitor sees is what Foresee actually produces. */}
        <div className="fc-strip" style={{ ["--fc-strip-color" as string]: "var(--fc-band-moderate)" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--fc-text-muted)", margin: "0 0 0.4rem" }}>
            {isRtlLocale ? "مثال على النتيجة" : "Example output"}
          </p>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>
            {isRtlLocale ? "عرض مشروط بمراجعة أداء" : "Conditional offer, tied to a review"}
          </h3>
          <p style={{ color: "var(--fc-text-secondary)", fontSize: "0.9rem", lineHeight: 1.55, margin: "0 0 0.9rem" }}>
            {isRtlLocale
              ? "المدير بيوافق على زيادة، بس بربطها بمراجعة أداء بعد ثلاث شهور بدل ما يوافق فوراً."
              : "The manager agrees to a raise, but ties it to a performance check-in in three months rather than approving it outright."}
          </p>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <BandGauge label={isRtlLocale ? "احتمالية" : "Likelihood"} value="moderate" />
            <BandGauge label={isRtlLocale ? "تأثير" : "Impact"} value="high" />
          </div>
        </div>
      </section>

      <section style={{ marginTop: "4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <a href={`/${locale}/forecast/new`} className="fc-strip" style={{ textDecoration: "none", color: "inherit" }}>
            <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>{t(locale, "hero.ctaPrimary")}</h3>
            <p style={{ color: "var(--fc-text-secondary)", margin: 0, fontSize: "0.88rem" }}>
              {t(locale, "forecast.situationLabel")}
            </p>
          </a>
          <a href={`/${locale}/onboarding`} className="fc-strip" style={{ textDecoration: "none", color: "inherit" }}>
            <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>{t(locale, "onboarding.title")}</h3>
            <p style={{ color: "var(--fc-text-secondary)", margin: 0, fontSize: "0.88rem" }}>
              {t(locale, "onboarding.intro")}
            </p>
          </a>
          <a href={`/${locale}/signup`} className="fc-strip" style={{ textDecoration: "none", color: "inherit" }}>
            <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>{t(locale, "nav.signup")}</h3>
            <p style={{ color: "var(--fc-text-secondary)", margin: 0, fontSize: "0.88rem" }}>
              {t(locale, "outcome.heading")}
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
