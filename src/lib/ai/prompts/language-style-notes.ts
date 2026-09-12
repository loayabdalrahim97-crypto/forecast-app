/**
 * §5/§6/§10-14: injected into the user prompt for es/fr/de/it/pt so
 * the model composes natively in that language instead of producing a
 * literal, English-syntax-shaped translation. Lighter than
 * ARABIC_STYLE_GUIDE (no dialect/RTL concerns for these languages),
 * but the same core principle: think in the target language, don't
 * translate an English sentence structure into it.
 */
const NOTES: Record<string, string> = {
  Spanish:
    "Write natively in neutral, professional Spanish suitable for both Spain and Latin America — not a regional dialect, not slang, not a literal translation of English sentence structure.",
  French:
    "Write natively in professional, natural French — not a literal translation of English sentence structure.",
  German:
    "Write natively in natural, professional German — not a literal translation of English sentence structure. Avoid keeping English word order; German syntax (verb position, compound nouns) should read as originally composed in German.",
  Italian:
    "Write natively in natural, professional Italian — not a literal translation of English sentence structure.",
  Portuguese:
    "Write natively in neutral Portuguese suitable for both Brazil and Portugal — not regional slang, not a literal translation of English sentence structure.",
};

/** Returns the style note for a language name, or "" if none applies (e.g. English itself, or Arabic which has its own dedicated guide). */
export function languageStyleNote(languageName: string): string {
  const note = NOTES[languageName];
  return note ? `\n\n${note}` : "";
}
