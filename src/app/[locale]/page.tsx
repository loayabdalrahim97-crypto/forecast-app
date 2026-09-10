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

function FeatureCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        border: "1px solid var(--fc-border)",
        borderRadius: "var(--fc-radius-lg)",
        background: "var(--fc-bg-card)",
        padding: "1.5rem",
        textDecoration: "none",
        color: "var(--fc-text-primary)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ color: "var(--fc-text-secondary)", margin: 0 }}>{description}</p>
    </a>
  );
}

export default function LocaleHome({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main style={{ padding: "3rem 2rem", maxWidth: 900, margin: "0 auto" }}>
      <section style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{t(locale, "hero.title")}</h1>
        <p style={{ color: "var(--fc-accent)", fontWeight: 600, letterSpacing: "0.05em" }}>
          {t(locale, "hero.subtitle")}
        </p>
        <p style={{ color: "var(--fc-text-secondary)", maxWidth: 500, margin: "1rem auto" }}>
          {t(locale, "hero.tagline")}
        </p>
        <a
          href={`/${locale}/forecast/new`}
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "var(--fc-radius-md)",
            background: "var(--fc-accent)",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {t(locale, "hero.ctaPrimary")}
        </a>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <FeatureCard
          href={`/${locale}/forecast/new`}
          title={t(locale, "hero.ctaPrimary")}
          description={t(locale, "forecast.situationLabel")}
        />
        <FeatureCard
          href={`/${locale}/onboarding`}
          title={t(locale, "onboarding.title")}
          description={t(locale, "onboarding.intro")}
        />
        <FeatureCard
          href={`/${locale}/signup`}
          title={t(locale, "nav.signup")}
          description={t(locale, "outcome.heading")}
        />
      </section>
    </main>
  );
}
