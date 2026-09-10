import type { SupportedLocale } from "./config";

/**
 * Display names shown in the language switcher — each name is written
 * in its OWN language (so an Arabic speaker sees "العربية", not
 * "Arabic"), the standard convention for language pickers.
 */
export const LOCALE_DISPLAY_NAMES: Record<SupportedLocale, string> = {
  "en-us": "English (US)",
  "en-gb": "English (UK)",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  nl: "Nederlands",
  pt: "Português",
  pl: "Polski",
  sv: "Svenska",
  da: "Dansk",
  no: "Norsk",
  fi: "Suomi",
  ar: "العربية",
};
