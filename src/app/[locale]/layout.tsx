import type { ReactNode } from "react";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import { SUPPORTED_LOCALES, isRtl } from "@/lib/i18n/config";
import { Providers } from "../providers";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import "@/design-system/tokens.css";

const heading = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--fc-font-heading-loaded",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fc-font-sans-loaded",
  display: "swap",
});

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${heading.variable} ${body.variable}`}>
      <body
        style={{
          // next/font sets --fc-font-*-loaded; bridge them onto the
          // names the design system actually uses so tokens.css stays
          // the single source of truth for what "heading font" means.
          ["--fc-font-heading" as string]: "var(--fc-font-heading-loaded)",
          ["--fc-font-sans" as string]: "var(--fc-font-sans-loaded)",
        }}
      >
        <Providers>
          <NavBar locale={locale} />
          {children}
          <Footer locale={locale} />
        </Providers>
      </body>
    </html>
  );
}
