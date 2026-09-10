// Placeholder root page for the locale route. Intentionally minimal —
// the real landing page (§7) and Free Forecast flow are later phases.
// This exists so `next build` actually generates the [locale] route
// instead of silently skipping it (an app directory with only a layout
// and no page produces no route at all).
export default function LocaleHome({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>FORECAST</h1>
      <p>Phase 1 scaffold — locale: {locale}</p>
      <p>
        <a href={`/${locale}/onboarding`} style={{ color: "var(--fc-accent)" }}>
          Behavioral Profile onboarding (Phase 2) →
        </a>
      </p>
    </main>
  );
}
