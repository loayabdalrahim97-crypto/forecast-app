// §3–4: language and country are separate concepts. This file is the
// single source of truth for supported locales — add a language here and
// nothing else in the app needs to change to route/serve it.

export const SUPPORTED_LOCALES = [
  "en-us",
  "en-gb",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "pt",
  "pl",
  "sv",
  "da",
  "no",
  "fi",
  "ar",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const RTL_LOCALES: SupportedLocale[] = ["ar"];

// §3: "AI responses must use the user's selected language." This is the
// mapping AI prompts use to tell the model which language to answer in
// — the model must never infer output language from the input text,
// since a user can type in one language while browsing in another.
export const LOCALE_LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  "en-us": "English",
  "en-gb": "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  nl: "Dutch",
  pt: "Portuguese",
  pl: "Polish",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  ar: "Arabic",
};

export function languageNameForLocale(locale: string): string {
  return LOCALE_LANGUAGE_NAMES[locale as SupportedLocale] ?? LOCALE_LANGUAGE_NAMES[DEFAULT_LOCALE];
}

export const DEFAULT_LOCALE: SupportedLocale = "en-us";

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale as SupportedLocale);
}

/**
 * §3 language resolution order:
 * 1. Explicit user selection (query/cookie)
 * 2. Saved account preference (user.preferredLanguage)
 * 3. Browser Accept-Language
 * 4. Locale-derived guess
 * 5. English fallback
 *
 * This function is pure and framework-agnostic so it's unit-testable
 * without a request context.
 */
export function resolveLocale(input: {
  explicit?: string | null;
  accountPreference?: string | null;
  acceptLanguage?: string | null;
}): SupportedLocale {
  const candidates = [input.explicit, input.accountPreference, input.acceptLanguage]
    .filter(Boolean)
    .map((v) => v!.toLowerCase());

  for (const candidate of candidates) {
    const exact = SUPPORTED_LOCALES.find((l) => l === candidate);
    if (exact) return exact;

    // fall back to language-only match, e.g. "de-AT" -> "de"
    const base = candidate.split("-")[0];
    const baseMatch = SUPPORTED_LOCALES.find((l) => l.split("-")[0] === base);
    if (baseMatch) return baseMatch;
  }

  return DEFAULT_LOCALE;
}
