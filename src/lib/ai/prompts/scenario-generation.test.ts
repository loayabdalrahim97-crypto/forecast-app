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
});
