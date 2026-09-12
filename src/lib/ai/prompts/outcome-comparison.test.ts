import { describe, expect, it } from "vitest";
import { buildOutcomeComparisonUserPrompt } from "./outcome-comparison";

describe("buildOutcomeComparisonUserPrompt", () => {
  it("includes each scenario title, likelihood, and description", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      unknowns: [],
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
      unknowns: [],
      scenarios: [],
      actualOutcome: "She apologized the next day.",
      languageName: "English",
    });
    expect(prompt).toContain("She apologized the next day.");
  });

  it("shows a placeholder when there are no assumptions or unknowns", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      unknowns: [],
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
      unknowns: [],
      scenarios: [],
      actualOutcome: "Outcome",
      languageName: "Arabic",
    });
    expect(prompt).toContain("Respond ONLY in Arabic");
  });

  it("lists the decision paths that were modeled, and tags each scenario with its path", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      unknowns: [],
      decisionPaths: ["Accept the offer", "Stay at current job"],
      scenarios: [
        { title: "Great new team", description: "...", likelihood: "moderate", pathLabel: "Accept the offer" },
      ],
      actualOutcome: "They stayed at their current job after a counteroffer.",
      languageName: "English",
    });
    expect(prompt).toContain("Decision paths that were modeled");
    expect(prompt).toContain("- Accept the offer");
    expect(prompt).toContain("- Stay at current job");
    expect(prompt).toContain("[Accept the offer]");
  });

  it("states plainly when no decision paths were modeled", () => {
    const prompt = buildOutcomeComparisonUserPrompt({
      situationText: "Situation X",
      assumptions: [],
      unknowns: [],
      decisionPaths: null,
      scenarios: [],
      actualOutcome: "Outcome",
      languageName: "English",
    });
    expect(prompt).toContain("No distinct decision paths were modeled");
  });
});
