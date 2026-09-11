import { describe, expect, it } from "vitest";
import { deriveFirstName } from "./derive-first-name";

describe("deriveFirstName", () => {
  it("takes the first word of a full name", () => {
    expect(deriveFirstName("Loay Abdalrahim")).toBe("Loay");
  });

  it("returns the whole string when there's only one word", () => {
    expect(deriveFirstName("Loay")).toBe("Loay");
  });

  it("returns null for missing, empty, or whitespace-only names", () => {
    expect(deriveFirstName(null)).toBeNull();
    expect(deriveFirstName(undefined)).toBeNull();
    expect(deriveFirstName("")).toBeNull();
    expect(deriveFirstName("   ")).toBeNull();
  });

  it("returns null for an implausibly long 'first word' (guards against garbage input)", () => {
    expect(deriveFirstName("a".repeat(50))).toBeNull();
  });

  it("handles Arabic names the same way", () => {
    expect(deriveFirstName("لؤي عبدالرحيم")).toBe("لؤي");
  });
});
