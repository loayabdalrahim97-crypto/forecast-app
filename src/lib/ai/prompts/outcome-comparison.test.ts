import { describe, expect, it } from "vitest";
import { buildOutcomeComparisonUserPrompt } from "./outcome-comparison";

describe("buildOutcomeComparisonUserPrompt", () => {
  it("includes each scenario title, likelihood, and description", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      scenarios: [
        { title: "Scenario A", description: "Description A", likelihood: "moderate" },
      ],
      actualOutcome: "It happened.",
      languageName: "English",
    });
    expect(prompt).toContain('"Scenario A"');
    expect(prompt).toContain("likelihood: moderate");
    expect(prompt).toContain("Description A");
  });

  it("includes the actual outcome text verbatim", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      scenarios: [],
      actualOutcome: "She apologized the next day.",
      languageName: "English",
    });
    expect(prompt).toContain("She apologized the next day.");
  });

  it("shows a placeholder when there are no assumptions", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      scenarios: [],
      actualOutcome: "Outcome",
      languageName: "English",
    });
    expect(prompt).toContain("(none)");
  });

  it("instructs the model to respond in the given language", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      scenarios: [],
      actualOutcome: "Outcome",
      languageName: "Arabic",
    });
    expect(prompt).toContain("Respond ONLY in Arabic");
  });
});
