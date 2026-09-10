import { describe, expect, it } from "vitest";
import { hasEnoughDataForPersonalization, MIN_OUTCOMES_FOR_PERSONALIZATION } from "./data-gate";

describe("hasEnoughDataForPersonalization", () => {
  it("returns false below the minimum", () => {
    expect(hasEnoughDataForPersonalization(0)).toBe(false);
    expect(hasEnoughDataForPersonalization(MIN_OUTCOMES_FOR_PERSONALIZATION - 1)).toBe(false);
  });

  it("returns true at and above the minimum", () => {
    expect(hasEnoughDataForPersonalization(MIN_OUTCOMES_FOR_PERSONALIZATION)).toBe(true);
    expect(hasEnoughDataForPersonalization(MIN_OUTCOMES_FOR_PERSONALIZATION + 5)).toBe(true);
  });
});
