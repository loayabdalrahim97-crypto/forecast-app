import { describe, expect, it } from "vitest";
import { ScenarioGenerationOutputSchema, SituationAnalysisSchema, FollowUpQuestionsSchema } from "./scenario";

describe("ScenarioGenerationOutputSchema", () => {
  const validScenario = {
    title: "Manager offers a conditional raise",
    description: "The manager proposes a raise tied to a performance review.",
    likelihood: "moderate",
    confidence: "moderate",
    impact: "high",
  };

  it("accepts 3 to 6 well-formed scenarios", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [validScenario, validScenario, validScenario],
    });
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 3 scenarios", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [validScenario, validScenario],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 6 scenarios", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: Array(7).fill(validScenario),
    });
    expect(result.success).toBe(false);
  });

  it("rejects fabricated decimal-precision likelihood instead of a band (section 13)", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, likelihood: "73.482%" },
        validScenario,
        validScenario,
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("SituationAnalysisSchema", () => {
  it("keeps facts, assumptions, and unknowns as separate fields (section 11, 50)", () => {
    const result = SituationAnalysisSchema.safeParse({
      facts: ["Manager requested a meeting."],
      assumptions: ["The manager intends to fire the user."],
      unknowns: ["Reason for the meeting."],
    });
    expect(result.success).toBe(true);
    expect(result.data?.facts).toEqual(["Manager requested a meeting."]);
    expect(result.data?.assumptions).toEqual(["The manager intends to fire the user."]);
    expect(result.data?.unknowns).toEqual(["Reason for the meeting."]);
  });

  it("defaults omitted categories to empty arrays rather than failing", () => {
    const result = SituationAnalysisSchema.safeParse({ facts: ["A fact."] });
    expect(result.success).toBe(true);
    expect(result.data?.assumptions).toEqual([]);
  });
});

describe("FollowUpQuestionsSchema", () => {
  it("accepts zero questions as valid (section 12 - over-asking is the failure mode)", () => {
    const result = FollowUpQuestionsSchema.safeParse({ questions: [] });
    expect(result.success).toBe(true);
  });

  it("accepts up to 3 questions", () => {
    const result = FollowUpQuestionsSchema.safeParse({
      questions: ["Q1?", "Q2?", "Q3?"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 3 questions", () => {
    const result = FollowUpQuestionsSchema.safeParse({
      questions: ["Q1?", "Q2?", "Q3?", "Q4?"],
    });
    expect(result.success).toBe(false);
  });
});
