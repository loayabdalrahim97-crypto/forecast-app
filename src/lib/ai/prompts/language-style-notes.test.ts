import { describe, expect, it } from "vitest";
import { languageStyleNote } from "./language-style-notes";

describe("languageStyleNote", () => {
  it("returns a native-composition note for each of the 5 newly-added languages", () => {
    for (const lang of ["Spanish", "French", "German", "Italian", "Portuguese"]) {
      const note = languageStyleNote(lang);
      expect(note).not.toBe("");
      expect(note.toLowerCase()).toContain("natively");
    }
  });

  it("returns nothing for English (no note needed)", () => {
    expect(languageStyleNote("English")).toBe("");
  });

  it("returns nothing for Arabic (has its own dedicated style guide instead)", () => {
    expect(languageStyleNote("Arabic")).toBe("");
  });

  it("returns nothing for an unrecognized language name", () => {
    expect(languageStyleNote("Klingon")).toBe("");
  });
});
