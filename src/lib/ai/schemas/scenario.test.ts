import { describe, expect, it } from "vitest";
import {
  ScenarioGenerationOutputSchema,
  SituationAnalysisSchema,
  FollowUpQuestionsSchema,
  OutcomeComparisonSchema,
  DecisionAnalysisOutputSchema,
  BusinessAnalysisOutputSchema,
} from "./scenario";

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

describe("OutcomeComparisonSchema", () => {
  it("accepts a null matchedScenarioTitle (section 18 - not forcing a match)", () => {
    const result = OutcomeComparisonSchema.safeParse({
      matchedScenarioTitle: null,
      whatWentRight: [],
      whatWasMissed: ["The forecast underestimated how quickly things resolved."],
      wrongAssumptions: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a matched scenario title", () => {
    const result = OutcomeComparisonSchema.safeParse({
      matchedScenarioTitle: "Conditional raise offered",
      whatWentRight: ["Correctly predicted a conditional offer"],
      whatWasMissed: [],
      wrongAssumptions: [],
    });
    expect(result.success).toBe(true);
  });

  it("defaults omitted arrays to empty rather than failing", () => {
    const result = OutcomeComparisonSchema.safeParse({ matchedScenarioTitle: null });
    expect(result.success).toBe(true);
    expect(result.data?.whatWentRight).toEqual([]);
  });
});

describe("DecisionAnalysisOutputSchema", () => {
  const validOption = {
    option: "Resign",
    upside: ["More time to find the right fit"],
    downside: ["Loss of income"],
    risk: "moderate",
    reversibility: "low",
    bestCase: "Finds a better role within a month.",
    baseCase: "Takes a few months to find a comparable role.",
    worstCase: "Extended unemployment.",
  };

  it("accepts 2 to 6 well-formed options", () => {
    const result = DecisionAnalysisOutputSchema.safeParse({
      options: [validOption, { ...validOption, option: "Stay" }],
      keyVariables: [],
      recommendation: "Consider staying while job searching quietly.",
      contingencyPlan: "Set a 3-month savings runway before resigning.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 2 options - decision mode compares choices", () => {
    const result = DecisionAnalysisOutputSchema.safeParse({
      options: [validOption],
      recommendation: "R",
      contingencyPlan: "C",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a fabricated numeric risk instead of a band", () => {
    const result = DecisionAnalysisOutputSchema.safeParse({
      options: [
        { ...validOption, risk: "73%" },
        { ...validOption, option: "Stay" },
      ],
      recommendation: "R",
      contingencyPlan: "C",
    });
    expect(result.success).toBe(false);
  });
});

describe("BusinessAnalysisOutputSchema", () => {
  const valid = {
    facts: ["User has $500 starting capital"],
    assumptions: ["User believes there's demand for handmade candles"],
    estimates: [
      {
        label: "Typical customer acquisition cost for a small e-commerce store",
        value: "$5-15 per customer",
        basis: "general industry heuristic, not specific market research",
      },
    ],
    breakEvenDescription: "Roughly 50 units at current cost/price assumptions.",
    sensitivity: ["Cost of materials"],
    upside: ["Low overhead"],
    downside: ["Saturated market"],
    executionRisk: "moderate",
    recommendation: "Start with a small batch to validate demand before scaling.",
  };

  it("accepts a well-formed business analysis", () => {
    const result = BusinessAnalysisOutputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("requires every estimate to state its basis (section 16 - never fabricate market data)", () => {
    const result = BusinessAnalysisOutputSchema.safeParse({
      ...valid,
      estimates: [{ label: "Market size", value: "$1B" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a fabricated numeric executionRisk instead of a band", () => {
    const result = BusinessAnalysisOutputSchema.safeParse({ ...valid, executionRisk: "62%" });
    expect(result.success).toBe(false);
  });
});
