import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Foresee",
};

const sectionStyle: React.CSSProperties = { marginBottom: "1.75rem" };
const headingStyle: React.CSSProperties = { fontSize: "1.05rem", marginBottom: "0.5rem" };
const pStyle: React.CSSProperties = { color: "var(--fc-text-secondary)", lineHeight: 1.7 };

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === "ar";

  return (
    <main style={{ padding: "2rem", maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
        {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
      </h1>
      <p style={{ color: "var(--fc-text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        {isAr ? "آخر تحديث: 12 سبتمبر 2026" : "Last updated: September 12, 2026"}
      </p>

      {isAr ? (
        <>
          <section style={sectionStyle}>
            <h2 style={headingStyle}>1. البيانات التي نجمعها</h2>
            <p style={pStyle}>
              نجمع البريد الإلكتروني وكلمة المرور (مشفّرة) عند إنشاء الحساب، والمحتوى الذي تدخله عند
              طلب توقع (السيناريو، الحقائق، الافتراضات)، وبيانات استخدام أساسية (عدد التوقعات، تاريخ
              الإنشاء) لتطبيق حدود الخطة المجانية/المدفوعة.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>2. كيف نستخدم بياناتك</h2>
            <p style={pStyle}>
              نستخدم بياناتك لتشغيل الخدمة (توليد التوقعات، إدارة حسابك واشتراكك)، وتحسين جودة
              النتائج، والتواصل معك بخصوص حسابك عند الحاجة. لا نبيع بياناتك لأي طرف ثالث.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>3. مشاركة البيانات مع أطراف ثالثة</h2>
            <p style={pStyle}>
              نشارك بيانات محدودة مع مزودي خدمات ضروريين لتشغيل المنصة فقط:
            </p>
            <ul style={{ ...pStyle, paddingInlineStart: "1.25rem" }}>
              <li>مزوّد نموذج الذكاء الاصطناعي — لمعالجة نص الموقف وتوليد السيناريو.</li>
              <li>PayPal — لمعالجة المدفوعات وإدارة الاشتراكات؛ لا نرى أو نخزّن بيانات بطاقتك.</li>
              <li>Railway — مزوّد الاستضافة وقاعدة البيانات.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>4. الاحتفاظ بالبيانات وحذفها</h2>
            <p style={pStyle}>
              نحتفظ ببياناتك طالما حسابك نشط. يمكنك طلب حذف حسابك وبياناته بالتواصل معنا على
              البريد أدناه.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>5. حقوقك</h2>
            <p style={pStyle}>
              يحق لك طلب الاطلاع على بياناتك، تصحيحها، أو حذفها في أي وقت.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>6. التواصل</h2>
            <p style={pStyle}>لأي استفسار حول الخصوصية: support@theforesee.com</p>
          </section>
        </>
      ) : (
        <>
          <section style={sectionStyle}>
            <h2 style={headingStyle}>1. Information we collect</h2>
            <p style={pStyle}>
              We collect your email and password (hashed) when you create an account, the content
              you provide when requesting a forecast (situation, facts, assumptions), and basic
              usage data (number of forecasts, creation dates) used to enforce free/paid plan
              limits.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>2. How we use your data</h2>
            <p style={pStyle}>
              We use your data to operate the Service (generating forecasts, managing your account
              and subscription), improve output quality, and contact you about your account when
              necessary. We do not sell your data to third parties.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>3. Sharing with third parties</h2>
            <p style={pStyle}>
              We share limited data only with providers necessary to run the platform:
            </p>
            <ul style={{ ...pStyle, paddingInlineStart: "1.25rem" }}>
              <li>Our AI model provider — to process your situation text and generate scenarios.</li>
              <li>
                PayPal — to process payments and manage subscriptions; we never see or store your
                card details.
              </li>
              <li>Railway — our hosting and database provider.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>4. Data retention and deletion</h2>
            <p style={pStyle}>
              We retain your data while your account is active. You may request deletion of your
              account and its data by contacting us at the email below.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>5. Your rights</h2>
            <p style={pStyle}>
              You may request access to, correction of, or deletion of your data at any time.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>6. Contact</h2>
            <p style={pStyle}>For privacy questions: support@theforesee.com</p>
          </section>
        </>
      )}
    </main>
  );
}
