import { describe, expect, it } from "vitest";
import { estimateCostUsd, MODEL_PRICING_PER_MILLION_TOKENS } from "./pricing";

describe("estimateCostUsd", () => {
  it("computes cost for a known model with no caching", () => {
    const cost = estimateCostUsd({
      model: "claude-haiku-4-5-20251001",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    const pricing = MODEL_PRICING_PER_MILLION_TOKENS["claude-haiku-4-5-20251001"];
    expect(cost).toBeCloseTo(pricing.input + pricing.output, 5);
  });

  it("discounts cached input tokens instead of charging full price", () => {
    const withoutCache = estimateCostUsd({
      model: "claude-sonnet-5",
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 0,
    });
    const withCache = estimateCostUsd({
      model: "claude-sonnet-5",
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 1_000_000,
    });
    expect(withCache).toBeLessThan(withoutCache);
  });

  it("falls back to default pricing for an unrecognized model rather than throwing", () => {
    const cost = estimateCostUsd({
      model: "some-future-model",
      inputTokens: 1000,
      outputTokens: 1000,
    });
    expect(cost).toBeGreaterThan(0);
  });

  it("returns zero for zero tokens", () => {
    expect(estimateCostUsd({ model: "claude-haiku-4-5-20251001", inputTokens: 0, outputTokens: 0 })).toBe(
      0
    );
  });
});
