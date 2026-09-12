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
    outcomeType: "most_likely",
    title: "Manager offers a conditional raise",
    description: "The manager proposes a raise tied to a performance review.",
    likelihood: "moderate",
    confidence: "moderate",
    impact: "high",
  };

  it("accepts exactly one best_case, one most_likely, one worst_case", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
      ],

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
    });
    expect(result.success).toBe(true);
  });

  describe("Decision Paths mode (accept-offer / stay example)", () => {
    const pathScenario = (pathLabel: string, outcomeType: string) => ({
      ...validScenario,
      pathLabel,
      outcomeType,
      title: `${pathLabel} - ${outcomeType}`,
    });

    it("accepts a well-formed 2-path set (3 positive/mixed/negative each)", () => {
      const result = ScenarioGenerationOutputSchema.safeParse({
        scenarios: [
          pathScenario("Accept the offer", "positive"),
          pathScenario("Accept the offer", "mixed"),
          pathScenario("Accept the offer", "negative"),
          pathScenario("Stay at current job", "positive"),
          pathScenario("Stay at current job", "mixed"),
          pathScenario("Stay at current job", "negative"),
        ],
        recommendedAction: { summary: "Ask for a written commitment before deciding.", conditionalBranches: [] },
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.scenarios).toHaveLength(6);
    });

    it("rejects a path with only 2 scenarios instead of 3 (a silent coverage gap)", () => {
      const result = ScenarioGenerationOutputSchema.safeParse({
        scenarios: [
          pathScenario("Accept the offer", "positive"),
          pathScenario("Accept the offer", "negative"),
          pathScenario("Stay at current job", "positive"),
          pathScenario("Stay at current job", "mixed"),
          pathScenario("Stay at current job", "negative"),
        ],
        recommendedAction: { summary: "Do X.", conditionalBranches: [] },
      });
      expect(result.success).toBe(false);
    });

    it("rejects mixing standard outcome types with path-labeled scenarios", () => {
      const result = ScenarioGenerationOutputSchema.safeParse({
        scenarios: [
          { ...validScenario, outcomeType: "best_case" },
          pathScenario("Accept the offer", "positive"),
          pathScenario("Accept the offer", "mixed"),
          pathScenario("Accept the offer", "negative"),
        ],
        recommendedAction: { summary: "Do X.", conditionalBranches: [] },
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 4 distinct decision paths", () => {
      const paths = ["A", "B", "C", "D", "E"];
      const scenarios = paths.flatMap((p) => [
        pathScenario(p, "positive"),
        pathScenario(p, "mixed"),
        pathScenario(p, "negative"),
      ]);
      const result = ScenarioGenerationOutputSchema.safeParse({
        scenarios,
        recommendedAction: { summary: "Do X.", conditionalBranches: [] },
      });
      expect(result.success).toBe(false);
    });

    it("rejects a single path (need at least 2 alternatives for Decision Paths mode)", () => {
      const result = ScenarioGenerationOutputSchema.safeParse({
        scenarios: [
          pathScenario("Accept the offer", "positive"),
          pathScenario("Accept the offer", "mixed"),
          pathScenario("Accept the offer", "negative"),
        ],
        recommendedAction: { summary: "Do X.", conditionalBranches: [] },
      });
      expect(result.success).toBe(false);
    });
  });

  it("rejects fewer than 3 scenarios", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "worst_case" },
      ],

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 scenarios", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
        { ...validScenario, outcomeType: "most_likely" },
      ],

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects two scenarios of the same outcome type (must be one of each)", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "worst_case" },
      ],

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects fabricated decimal-precision likelihood instead of a band (section 13)", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case", likelihood: "73.482%" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
      ],

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
    });
    expect(result.success).toBe(false);
  });

  it("accepts conditional branches in recommendedAction", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
      ],
      recommendedAction: {
        summary: "Wait for the review, but prepare your case now.",
        conditionalBranches: [
          { condition: "If the raise is approved", action: "Confirm the effective date in writing." },
          { condition: "If it's declined", action: "Ask directly what specific criteria would change the outcome." },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty whatCouldChangeForecast when nothing would materially change the picture", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
      ],
      recommendedAction: { summary: "Do X.", conditionalBranches: [] },
      whatCouldChangeForecast: [],
    });
    expect(result.success).toBe(true);
  });

  it("requires recommendedAction.summary", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
      ],
      recommendedAction: { conditionalBranches: [] },
    });
    expect(result.success).toBe(false);
  });

  it("defaults limitsOfForecast to null when omitted (most reports have nothing to say here)", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
      ],
      recommendedAction: { summary: "Do X.", conditionalBranches: [] },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limitsOfForecast).toBeNull();
  });

  it("accepts a contextual limitsOfForecast string", () => {
    const result = ScenarioGenerationOutputSchema.safeParse({
      scenarios: [
        { ...validScenario, outcomeType: "best_case" },
        { ...validScenario, outcomeType: "most_likely" },
        { ...validScenario, outcomeType: "worst_case" },
      ],
      recommendedAction: { summary: "Do X.", conditionalBranches: [] },
      limitsOfForecast: "Whether the manager's tone reflects a specific concern can't be established from one message.",
    });
    expect(result.success).toBe(true);
  });
});

describe("SituationAnalysisSchema", () => {
  it("keeps facts, assumptions, and unknowns as separate fields (section 11, 50)", () => {
    const result = SituationAnalysisSchema.safeParse({
      facts: ["Manager requested a meeting."],
      assumptions: ["The manager intends to fire the user."],
      unknowns: ["Reason for the meeting."],

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
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

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 3 questions", () => {
    const result = FollowUpQuestionsSchema.safeParse({
      questions: ["Q1?", "Q2?", "Q3?", "Q4?"],

    recommendedAction: { summary: "Do X.", conditionalBranches: [] },
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
