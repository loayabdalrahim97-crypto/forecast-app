import enUs from "../../../messages/en-us.json";
import ar from "../../../messages/ar.json";
import es from "../../../messages/es.json";
import fr from "../../../messages/fr.json";
import de from "../../../messages/de.json";
import it from "../../../messages/it.json";
import pt from "../../../messages/pt.json";

// §25: structured translation dictionaries, one file per language,
// no strings duplicated inline in components. Adding a language from
// here on is: translate the JSON file, add one line here — nothing
// else in the app needs to change.
export const MESSAGES: Record<string, typeof enUs> = {
  "en-us": enUs,
  "en-gb": enUs,
  ar,
  es,
  fr,
  de,
  it,
  pt,
};

// §2 (language selector): only locales with an actual translated
// dictionary belong in the switcher — SUPPORTED_LOCALES also lists
// "future-ready" locales (nl, pl, sv, da, no, fi) that the config
// layer is ready to route, but showing them in the picker before a
// real translation exists would be exactly the "half-translated
// product" this whole effort is meant to avoid. en-gb intentionally
// shares the en-us dictionary (same language) rather than listing
// twice.
export const LAUNCHED_LOCALES = ["en-us", "ar", "es", "fr", "de", "it", "pt"] as const;

/**
 * §26: missing-translation fallback. If a locale's dictionary is
 * missing (not yet translated — e.g. a locale from SUPPORTED_LOCALES
 * that isn't in MESSAGES yet, such as nl/pl/sv/da/no/fi), or a specific
 * key is missing within an otherwise-translated dictionary, this falls
 * back to English rather than ever rendering "undefined" or crashing
 * the page.
 */
export function t(locale: string, path: string, vars?: Record<string, string | number>): string {
  const dict = MESSAGES[locale] ?? enUs;
  const lookup = (source: unknown): unknown =>
    path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, source);

  const value = lookup(dict);
  const englishValue = lookup(enUs);
  let str = typeof value === "string" ? value : typeof englishValue === "string" ? englishValue : path;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
