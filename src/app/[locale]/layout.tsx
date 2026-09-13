import type { ReactNode } from "react";
import Script from "next/script";
import { Space_Grotesk, IBM_Plex_Sans, Noto_Sans_Arabic } from "next/font/google";
import { SUPPORTED_LOCALES, isRtl } from "@/lib/i18n/config";
import { Providers } from "../providers";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import "@/design-system/tokens.css";

// Optional — analytics stays off entirely (no scripts, no requests)
// unless this env var is set, so local/dev builds never send data and
// the feature can be disabled by simply removing the Railway variable.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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

// Neither font above ships Arabic glyphs (both are "latin"-subset only),
// so every Arabic character on this site — including inside the
// generated PDF report, which is captured from this same live DOM —
// was falling back to whatever generic system font each visitor's
// browser happened to substitute, which is inconsistent in quality and
// was confirmed (by rendering an actual exported report) to garble
// specific letter combinations in certain headings. Loading a real
// Arabic-covering font here fixes it at the source for the whole site,
// not just the PDF.
const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--fc-font-arabic-loaded",
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
    <html lang={locale} dir={dir} className={`${heading.variable} ${body.variable} ${arabic.variable}`}>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
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
