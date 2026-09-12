const linkStyle: React.CSSProperties = {
  color: "var(--fc-text-muted)",
  textDecoration: "none",
  fontSize: "0.82rem",
};

export function Footer({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--fc-border)",
        marginTop: "3rem",
        padding: "1.5rem 2rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "1.25rem",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ ...linkStyle, color: "var(--fc-text-muted)" }}>
        © {year} Foresee
      </span>
      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
        <a href={`/${locale}/terms`} style={linkStyle}>
          {isAr ? "الشروط" : "Terms"}
        </a>
        <a href={`/${locale}/privacy`} style={linkStyle}>
          {isAr ? "الخصوصية" : "Privacy"}
        </a>
        <a href={`/${locale}/refund`} style={linkStyle}>
          {isAr ? "الاسترداد" : "Refunds"}
        </a>
        <a href="mailto:support@theforesee.com" style={linkStyle}>
          {isAr ? "تواصل معنا" : "Contact"}
        </a>
      </div>
    </footer>
  );
}
