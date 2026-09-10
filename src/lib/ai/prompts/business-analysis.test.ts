import { describe, expect, it } from "vitest";
import { buildBusinessAnalysisUserPrompt } from "./business-analysis";

describe("buildBusinessAnalysisUserPrompt", () => {
  it("includes the situation text verbatim", () => {
    const prompt = buildBusinessAnalysisUserPrompt(
      "I want to sell handmade candles online with $500 starting capital.",
      "English"
    );
    expect(prompt).toContain("$500 starting capital");
  });

  it("instructs the model to respond in the given language", () => {
    const prompt = buildBusinessAnalysisUserPrompt("Business idea", "French");
    expect(prompt).toContain("Respond ONLY in French");
  });
});
