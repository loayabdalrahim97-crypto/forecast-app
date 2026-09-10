import { describe, expect, it } from "vitest";
import { buildDecisionAnalysisUserPrompt } from "./decision-analysis";

describe("buildDecisionAnalysisUserPrompt", () => {
  it("lists explicit options when provided", () => {
    const prompt = buildDecisionAnalysisUserPrompt({
      situationText: "Choosing between two job offers.",
      facts: [],
      assumptions: [],
      explicitOptions: ["Offer A", "Offer B"],
      languageName: "English",
    });
    expect(prompt).toContain("- Offer A");
    expect(prompt).toContain("- Offer B");
  });

  it("asks the model to infer options when none are given", () => {
    const prompt = buildDecisionAnalysisUserPrompt({
      situationText: "Should I resign?",
      facts: [],
      assumptions: [],
      explicitOptions: [],
      languageName: "English",
    });
    expect(prompt).toContain("infer the natural options");
  });

  it("instructs the model to respond in the given language", () => {
    const prompt = buildDecisionAnalysisUserPrompt({
      situationText: "Situation",
      facts: [],
      assumptions: [],
      explicitOptions: [],
      languageName: "Arabic",
    });
    expect(prompt).toContain("Respond ONLY in Arabic");
  });
});
