import { describe, expect, it } from "vitest";
import { buildScenarioGenerationUserPrompt } from "./scenario-generation";

const baseParams = {
  situationText: "Situation X",
  facts: [],
  assumptions: [],
  unknowns: [],
  behavioralVariables: [],
  externalVariables: [],
  behavioralProfileSummary: [],
  languageName: "English",
};

describe("buildScenarioGenerationUserPrompt", () => {
  it("includes the first name and personalization guidance when given", () => {
    const prompt = buildScenarioGenerationUserPrompt({ ...baseParams, firstName: "Loay" });
    expect(prompt).toContain('"Loay"');
    expect(prompt).toContain('never write "the user"');
    expect(prompt).toContain("Do not put the name in scenario titles");
  });

  it("falls back to you/your guidance when no first name is available", () => {
    const prompt = buildScenarioGenerationUserPrompt({ ...baseParams, firstName: null });
    expect(prompt).toContain("No name is available");
    expect(prompt).toContain("you/your");
  });

  it("falls back the same way when firstName is simply omitted", () => {
    const prompt = buildScenarioGenerationUserPrompt(baseParams);
    expect(prompt).toContain("No name is available");
  });

  it("includes the Arabic style guide and terminology dictionary only when the language is Arabic", () => {
    const arabicPrompt = buildScenarioGenerationUserPrompt({ ...baseParams, languageName: "Arabic" });
    expect(arabicPrompt).toContain("NEVER use regional dialect");
    expect(arabicPrompt).toContain("أفضل سيناريو");

    const englishPrompt = buildScenarioGenerationUserPrompt(baseParams);
    expect(englishPrompt).not.toContain("NEVER use regional dialect");
  });

  it("injects the Decision Paths instruction with exact path labels when 2+ paths are given", () => {
    const prompt = buildScenarioGenerationUserPrompt({
      ...baseParams,
      decisionPaths: ["Accept the offer", "Stay at current job"],
    });
    expect(prompt).toContain("DECISION PATHS DETECTED");
    expect(prompt).toContain("- Accept the offer");
    expect(prompt).toContain("- Stay at current job");
  });

  it("does not inject the Decision Paths instruction when null or omitted", () => {
    const promptNull = buildScenarioGenerationUserPrompt({ ...baseParams, decisionPaths: null });
    expect(promptNull).not.toContain("DECISION PATHS DETECTED");

    const promptOmitted = buildScenarioGenerationUserPrompt(baseParams);
    expect(promptOmitted).not.toContain("DECISION PATHS DETECTED");
  });
});
