import { describe, expect, it } from "vitest";
import { resolveLocale, isRtl, DEFAULT_LOCALE, languageNameForLocale } from "./config";

describe("resolveLocale", () => {
  it("prefers explicit selection over everything else", () => {
    expect(
      resolveLocale({ explicit: "de", accountPreference: "fr", acceptLanguage: "es" })
    ).toBe("de");
  });

  it("falls back to account preference when no explicit selection", () => {
    expect(resolveLocale({ accountPreference: "fr", acceptLanguage: "es" })).toBe("fr");
  });

  it("falls back to browser language when no explicit or account preference", () => {
    expect(resolveLocale({ acceptLanguage: "it" })).toBe("it");
  });

  it("matches on language base when region doesn't match exactly", () => {
    expect(resolveLocale({ explicit: "de-AT" })).toBe("de");
  });

  it("falls back to English when nothing matches", () => {
    expect(resolveLocale({ explicit: "xx-YY" })).toBe(DEFAULT_LOCALE);
  });

  it("falls back to English when no input is given at all", () => {
    expect(resolveLocale({})).toBe(DEFAULT_LOCALE);
  });
});

describe("isRtl", () => {
  it("flags Arabic as RTL", () => {
    expect(isRtl("ar")).toBe(true);
  });

  it("does not flag English as RTL", () => {
    expect(isRtl("en-us")).toBe(false);
  });
});

describe("languageNameForLocale", () => {
  it("maps a locale to its display language name", () => {
    expect(languageNameForLocale("ar")).toBe("Arabic");
    expect(languageNameForLocale("de")).toBe("German");
    expect(languageNameForLocale("en-us")).toBe("English");
  });

  it("falls back to the default locale's language for an unknown locale", () => {
    expect(languageNameForLocale("xx-YY")).toBe("English");
  });
});
