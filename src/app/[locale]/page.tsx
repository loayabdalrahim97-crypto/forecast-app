import { BandGauge } from "@/components/band-gauge";
import { t } from "@/lib/i18n/messages";

const stepCardStyle: React.CSSProperties = {
  background: "var(--fc-bg-card)",
  border: "1px solid var(--fc-border)",
  borderRadius: "var(--fc-radius-md)",
  padding: "1.25rem",
};

const stepNumberStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "var(--fc-accent-soft)",
  color: "var(--fc-accent)",
  fontFamily: "var(--fc-font-heading)",
  fontWeight: 600,
  fontSize: "0.9rem",
  marginBottom: "0.75rem",
};

export default function LocaleHome({ params: { locale } }: { params: { locale: string } }) {
  const isRtlLocale = locale === "ar";

  const steps = isRtlLocale
    ? [
        {
          number: "١",
          title: "اوصف موقفك",
          body: "اكتب اللي عم يصير بكم جملة بلغتك الطبيعية — بدون أي صيغة خاصة.",
        },
        {
          number: "٢",
          title: "فصل الحقائق عن الافتراضات",
          body: "Foresee يفصل تلقائياً بين اللي متأكد منه واللي مجرد تخمين أو خوف.",
        },
        {
          number: "٣",
          title: "شوف 3 سيناريوهات واقعية + إجراءات مقترحة",
          body: "أفضل حالة، الحالة الأرجح، وأسوأ حالة — كل وحدة مع خطوة عملية توصى فيها.",
        },
      ]
    : [
        {
          number: "1",
          title: "Describe your situation",
          body: "Write what's happening in a few sentences — no special format needed.",
        },
        {
          number: "2",
          title: "Separate facts from assumptions",
          body: "Foresee automatically splits what you actually know from what you're only assuming or fearing.",
        },
        {
          number: "3",
          title: "Get 3 realistic scenarios + recommended actions",
          body: "A best case, most likely case, and worst case — each with a concrete next step.",
        },
      ];

  const exampleScenarios = isRtlLocale
    ? [
        {
          label: "أفضل حالة",
          color: "var(--fc-positive)",
          title: "موافقة فورية بدون شروط",
          body: "المدير يوافق على الزيادة مباشرة بنفس الاجتماع.",
        },
        {
          label: "الحالة الأرجح",
          color: "var(--fc-band-moderate)",
          title: "موافقة مبدئية مربوطة بمراجعة",
          body: "يوافق من حيث المبدأ، بس بربطها بمراجعة أداء بعد 3 شهور.",
        },
        {
          label: "أسوأ حالة",
          color: "var(--fc-band-high)",
          title: "تأجيل بسبب الميزانية",
          body: "يرفض حالياً بحجة تجميد الميزانية، مع ترك الباب مفتوح للربع الجاي.",
        },
      ]
    : [
        {
          label: "Best case",
          color: "var(--fc-positive)",
          title: "Approved on the spot",
          body: "Your manager approves the raise immediately, no conditions attached.",
        },
        {
          label: "Most likely",
          color: "var(--fc-band-moderate)",
          title: "Approved in principle",
          body: "They agree in principle but tie it to a performance check-in in 3 months.",
        },
        {
          label: "Worst case",
          color: "var(--fc-band-high)",
          title: "Delayed over budget",
          body: "They decline for now, citing a budget freeze — but leave next quarter open.",
        },
      ];

  return (
    <main style={{ padding: "3.5rem 2rem 4rem", maxWidth: 980, margin: "0 auto" }}>
      <section className="fc-hero-grid">
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
          <p style={{ margin: "0.6rem 0 0", fontSize: "0.78rem", color: "var(--fc-text-muted)" }}>
            {isRtlLocale ? "مجاني للتجربة · بدون بطاقة ائتمان" : "Free to try · No credit card required"}
          </p>
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

      {/* How it works — 3 simple steps, right after the hero so a new
          visitor understands the mechanism before anything else. */}
      <section style={{ marginTop: "4rem" }}>
        <h2 style={{ fontSize: "1.4rem", textAlign: "center", marginBottom: "1.75rem" }}>
          {isRtlLocale ? "كيف يشتغل" : "How it works"}
        </h2>
        <div className="fc-grid-3">
          {steps.map((step) => (
            <div key={step.title} style={stepCardStyle}>
              <span style={stepNumberStyle}>{step.number}</span>
              <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>{step.title}</h3>
              <p style={{ color: "var(--fc-text-secondary)", margin: 0, fontSize: "0.88rem", lineHeight: 1.6 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What makes this different from just asking ChatGPT — a single
          direct line rather than a marketing block, placed where the
          question naturally comes up (right after seeing how it works). */}
      <section style={{ marginTop: "2.5rem", textAlign: "center" }}>
        <p
          style={{
            maxWidth: 640,
            margin: "0 auto",
            color: "var(--fc-text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.7,
          }}
        >
          {isRtlLocale
            ? "معظم الناس يركّزون على نتيجة وحدة يخافون منها. Foresee يعرض لك كامل مجال الاحتمالات الواقعية ويساعدك تستعد لكل وحدة منها."
            : "Most people fixate on one feared outcome. Foresee shows you the full range of realistic possibilities and helps you prepare for each."}
        </p>
      </section>

      {/* "See Foresee in action" — a real 3-scenario example instead of
          a large empty-feeling promo image, so the value is visible
          without any interaction. */}
      <section style={{ marginTop: "3.5rem" }}>
        <p style={{ fontSize: "0.8rem", color: "var(--fc-text-muted)", textAlign: "center", marginBottom: "1.25rem" }}>
          {isRtlLocale ? "شوف فورسي وهو شغال" : "See Foresee in action"}
        </p>
        <div className="fc-grid-3">
          {exampleScenarios.map((s) => (
            <div key={s.label} className="fc-strip" style={{ ["--fc-strip-color" as string]: s.color }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: s.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  margin: "0 0 0.5rem",
                }}
              >
                {s.label}
              </p>
              <h3 style={{ margin: "0 0 0.4rem", fontSize: "0.98rem" }}>{s.title}</h3>
              <p style={{ color: "var(--fc-text-secondary)", margin: 0, fontSize: "0.85rem", lineHeight: 1.55 }}>
                {s.body}
              </p>
            </div>
          ))}
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
