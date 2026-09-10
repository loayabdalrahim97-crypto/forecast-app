import { describe, expect, it } from "vitest";
import { computeRealityCheck } from "./reality-check";

describe("computeRealityCheck", () => {
  it("computes the facts percentage against the total", () => {
    const result = computeRealityCheck(4, 3, 3);
    expect(result.solidFactsPct).toBe(40);
    expect(result.assumptionsGapsPct).toBe(60);
  });

  it("badges 'high_assumption' when assumptions+unknowns exceed 60%", () => {
    const result = computeRealityCheck(2, 5, 4);
    expect(result.assumptionsGapsPct).toBeGreaterThan(60);
    expect(result.badge).toBe("high_assumption");
  });

  it("badges 'grounded' when facts exceed 60%", () => {
    const result = computeRealityCheck(8, 1, 1);
    expect(result.solidFactsPct).toBeGreaterThan(60);
    expect(result.badge).toBe("grounded");
  });

  it("badges 'mixed' when neither side clears 60%", () => {
    const result = computeRealityCheck(5, 3, 2);
    expect(result.solidFactsPct).toBe(50);
    expect(result.badge).toBe("mixed");
  });

  it("handles zero items without dividing by zero", () => {
    const result = computeRealityCheck(0, 0, 0);
    expect(result.solidFactsPct).toBe(0);
    expect(result.badge).toBe("high_assumption");
  });

  it("exactly 60% does not trigger either threshold (strictly greater than)", () => {
    const result = computeRealityCheck(6, 4, 0);
    expect(result.solidFactsPct).toBe(60);
    expect(result.badge).toBe("mixed");
  });
});
