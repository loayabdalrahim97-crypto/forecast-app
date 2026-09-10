"use client";

import { usePathname, useRouter } from "next/navigation";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { LOCALE_DISPLAY_NAMES } from "@/lib/i18n/display-names";

export function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value;
    // Swap only the locale segment, keep the rest of the path (e.g.
    // /en-us/forecast/new -> /ar/forecast/new) so switching language
    // never loses the person's place in the app.
    const rest = pathname.replace(new RegExp(`^/${locale}`), "");
    router.push(`/${nextLocale}${rest}`);
  }

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={handleChange}
      className="fc-input"
      style={{
        width: "auto",
        marginBottom: 0,
        padding: "0.4rem 0.6rem",
        fontSize: "0.82rem",
        cursor: "pointer",
      }}
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_DISPLAY_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
