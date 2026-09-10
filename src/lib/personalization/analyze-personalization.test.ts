import { describe, expect, it } from "vitest";
import { analyzePersonalization } from "./analyze-personalization";

describe("analyzePersonalization", () => {
  it("returns no insights without calling the AI when history is below the minimum (section 19)", async () => {
    // No ANTHROPIC_API_KEY is configured in the test environment — if
    // this function tried to call the AI, it would throw. A clean
    // empty result proves the data-gate short-circuit works.
    const result = await analyzePersonalization({
      history: [
        { situationText: "One situation", assumptions: ["An assumption"], wrongAssumptions: [] },
      ],
      locale: "en-us",
    });
    expect(result.data.insights).toEqual([]);
    expect(result.meta).toBeNull();
  });
});
