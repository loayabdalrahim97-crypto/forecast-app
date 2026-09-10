import type { ReactNode } from "react";
import { SUPPORTED_LOCALES, isRtl } from "@/lib/i18n/config";
import { Providers } from "../providers";
import { NavBar } from "@/components/nav-bar";
import "@/design-system/tokens.css";

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
    <html lang={locale} dir={dir}>
      <body>
        <Providers>
          <NavBar locale={locale} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
