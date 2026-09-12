import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — Foresee",
};

const sectionStyle: React.CSSProperties = { marginBottom: "1.75rem" };
const headingStyle: React.CSSProperties = { fontSize: "1.05rem", marginBottom: "0.5rem" };
const pStyle: React.CSSProperties = { color: "var(--fc-text-secondary)", lineHeight: 1.7 };

export default function RefundPage({ params }: { params: { locale: string } }) {
  const isAr = params.locale === "ar";

  return (
    <main style={{ padding: "2rem", maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
        {isAr ? "سياسة الاسترداد والإلغاء" : "Refund & Cancellation Policy"}
      </h1>
      <p style={{ color: "var(--fc-text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        {isAr ? "آخر تحديث: 12 سبتمبر 2026" : "Last updated: September 12, 2026"}
      </p>

      {isAr ? (
        <>
          <section style={sectionStyle}>
            <h2 style={headingStyle}>الإلغاء</h2>
            <p style={pStyle}>
              يمكنك إلغاء اشتراكك (الشهري أو السنوي) في أي وقت من صفحة الفوترة بحسابك. عند الإلغاء،
              يستمر وصولك الكامل لميزات الخطة المدفوعة حتى نهاية الفترة التي دفعت عنها بالفعل، ثم
              يعود حسابك تلقائياً للخطة المجانية. لا يتم تجديد الاشتراك بعد الإلغاء.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>الاسترداد</h2>
            <p style={pStyle}>
              المبالغ المدفوعة عن فترة اشتراك حالية (شهرية أو سنوية) غير قابلة للاسترداد الجزئي عن
              المدة غير المستخدمة. إذا واجهت مشكلة تقنية منعتك من استخدام الخدمة بشكل كامل خلال أول
              7 أيام من أول عملية دفع، تواصل معنا وسنقيّم طلبك لاسترداد كامل بشكل استثنائي.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>كيفية الطلب</h2>
            <p style={pStyle}>
              لأي طلب استرداد أو استفسار، راسلنا على support@theforesee.com مع ذكر البريد
              الإلكتروني المستخدم بالحساب وتاريخ الدفع.
            </p>
          </section>
        </>
      ) : (
        <>
          <section style={sectionStyle}>
            <h2 style={headingStyle}>Cancellation</h2>
            <p style={pStyle}>
              You may cancel your subscription (monthly or annual) at any time from your
              account&apos;s billing page. After cancelling, you keep full access to your paid
              plan&apos;s features until the end of the period you&apos;ve already paid for, then
              your account automatically moves to the free plan. The subscription will not renew
              after cancellation.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>Refunds</h2>
            <p style={pStyle}>
              Payments for a current subscription period (monthly or annual) are non-refundable
              for unused time. If a technical issue prevented you from using the Service at all
              within the first 7 days of your first payment, contact us and we will review your
              case for a full refund on an exceptional basis.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={headingStyle}>How to request one</h2>
            <p style={pStyle}>
              For any refund request or question, email support@theforesee.com with the account
              email and payment date.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
