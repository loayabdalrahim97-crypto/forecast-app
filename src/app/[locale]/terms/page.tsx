import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Foresee",
};

const sectionStyle: React.CSSProperties = { marginBottom: "1.75rem" };
const headingStyle: React.CSSProperties = { fontSize: "1.05rem", marginBottom: "0.5rem" };
const pStyle: React.CSSProperties = { color: "var(--fc-text-secondary)", lineHeight: 1.7 };

export default function TermsPage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === "ar";

  return (
    <main style={{ padding: "2rem", maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
        {isAr ? "شروط الخدمة" : "Terms of Service"}
      </h1>
      <p style={{ color: "var(--fc-text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        {isAr ? "آخر تحديث: 12 سبتمبر 2026" : "Last updated: September 12, 2026"}
      </p>

      {isAr ? (
        <>
          <section style={sectionStyle}>
            <h2 style={headingStyle}>1. قبول الشروط</h2>
            <p style={pStyle}>
              باستخدامك لموقع وخدمة Foresee ("الخدمة")، فإنك توافق على هذه الشروط بالكامل. إذا كنت
              لا توافق على أي جزء منها، يرجى عدم استخدام الخدمة.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>2. وصف الخدمة</h2>
            <p style={pStyle}>
              Foresee منصة تستخدم الذكاء الاصطناعي لتحليل المواقف التي يصفها المستخدم وتوليد
              سيناريوهات مستقبلية محتملة مع تقدير للاحتمالية والأثر. النتائج المقدمة هي أدوات
              مساعدة على التفكير واتخاذ القرار، <strong>وليست نصيحة مالية أو قانونية أو طبية أو
              مهنية</strong>، ولا تشكل ضماناً بحدوث أي نتيجة مستقبلية فعلية.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>3. الحسابات والاشتراكات</h2>
            <p style={pStyle}>
              تحتاج لإنشاء حساب لاستخدام معظم ميزات الخدمة. أنت مسؤول عن الحفاظ على سرية بيانات
              دخولك. تُقدَّم الخطة المجانية بحدود استخدام شهرية محددة، وتُقدَّم خطط مدفوعة (شهرية
              وسنوية) عبر PayPal بتجديد تلقائي في نهاية كل دورة فوترة ما لم يتم الإلغاء قبلها.
              يمكنك إلغاء اشتراكك في أي وقت من صفحة الفوترة بحسابك؛ يستمر الاشتراك فعّالاً حتى نهاية
              الفترة المدفوعة الحالية.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>4. الاستخدام المقبول</h2>
            <p style={pStyle}>
              يُمنع استخدام الخدمة لأي غرض غير قانوني، أو لمحاولة إساءة استخدام أو تجاوز حدود
              الاستخدام أو آليات الحماية التقنية، أو لانتحال هوية شخص آخر.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>5. إخلاء المسؤولية</h2>
            <p style={pStyle}>
              تُقدَّم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية. لا تتحمل Foresee مسؤولية أي
              قرارات تُتخذ بناءً على السيناريوهات أو التوقعات المقدَّمة عبر الخدمة.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>6. التعديلات على الشروط</h2>
            <p style={pStyle}>
              قد يتم تحديث هذه الشروط من وقت لآخر. الاستمرار في استخدام الخدمة بعد أي تعديل يُعد
              موافقة على الشروط المحدَّثة.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>7. التواصل</h2>
            <p style={pStyle}>
              لأي استفسار بخصوص هذه الشروط، يرجى التواصل عبر: support@theforesee.com
            </p>
          </section>
        </>
      ) : (
        <>
          <section style={sectionStyle}>
            <h2 style={headingStyle}>1. Acceptance of terms</h2>
            <p style={pStyle}>
              By using the Foresee website and service (the &quot;Service&quot;), you agree to
              these Terms in full. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>2. Description of the service</h2>
            <p style={pStyle}>
              Foresee uses AI to analyze a situation you describe and generate plausible future
              scenarios with an estimated likelihood and impact. The output is a thinking and
              decision-support tool — <strong>it is not financial, legal, medical, or professional
              advice</strong>, and it is not a guarantee that any particular outcome will occur.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>3. Accounts and subscriptions</h2>
            <p style={pStyle}>
              You need an account to use most features. You are responsible for keeping your
              login credentials confidential. A free plan is available with monthly usage limits;
              paid plans (monthly and annual) are billed through PayPal and renew automatically at
              the end of each billing cycle unless cancelled beforehand. You may cancel at any
              time from your account&apos;s billing page; your subscription remains active until
              the end of the current paid period.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>4. Acceptable use</h2>
            <p style={pStyle}>
              You may not use the Service for any unlawful purpose, attempt to abuse or bypass
              usage limits or technical safeguards, or impersonate another person.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>5. Disclaimer</h2>
            <p style={pStyle}>
              The Service is provided &quot;as is&quot; without warranties of any kind, express or
              implied. Foresee is not liable for decisions made based on scenarios or forecasts
              generated by the Service.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>6. Changes to these terms</h2>
            <p style={pStyle}>
              These Terms may be updated from time to time. Continued use of the Service after any
              change constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>7. Contact</h2>
            <p style={pStyle}>
              For questions about these Terms, contact: support@theforesee.com
            </p>
          </section>
        </>
      )}
    </main>
  );
}
