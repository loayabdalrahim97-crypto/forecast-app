import { describe, expect, it } from "vitest";
import {
  buildProfileFromAnswers,
  remainingQuestions,
  InvalidAnswerError,
} from "./build-profile";
import { BEHAVIORAL_PROFILE_QUESTIONS } from "./questions";

describe("buildProfileFromAnswers", () => {
  it("maps a scalar (non-boolean) answer to its attribute verbatim", () => {
    const profile = buildProfileFromAnswers([
      { questionId: "decision_style", value: "analytical" },
    ]);
    expect(profile.decisionStyle).toBe("analytical");
  });

  it("maps a boolean tendency question to a real boolean, not a string", () => {
    const profile = buildProfileFromAnswers([
      { questionId: "overthinking", value: "true" },
    ]);
    expect(profile.overthinkingTendency).toBe(true);
    expect(typeof profile.overthinkingTendency).toBe("boolean");
  });

  it("maps a 'no' boolean answer to false", () => {
    const profile = buildProfileFromAnswers([
      { questionId: "catastrophizing", value: "false" },
    ]);
    expect(profile.catastrophizingTendency).toBe(false);
  });

  it("combines multiple answers into one profile", () => {
    const profile = buildProfileFromAnswers([
      { questionId: "decision_style", value: "intuitive" },
      { questionId: "risk_tolerance", value: "high" },
      { questionId: "conflict_avoidance", value: "true" },
    ]);
    expect(profile).toEqual({
      decisionStyle: "intuitive",
      riskTolerance: "high",
      conflictAvoidance: true,
    });
  });

  it("rejects an unknown question id rather than silently dropping it", () => {
    expect(() =>
      buildProfileFromAnswers([{ questionId: "not_a_real_question", value: "x" }])
    ).toThrow(InvalidAnswerError);
  });

  it("rejects an option value that isn't one of the question's choices", () => {
    expect(() =>
      buildProfileFromAnswers([{ questionId: "decision_style", value: "chaotic" }])
    ).toThrow(InvalidAnswerError);
  });

  it("returns an empty profile for no answers", () => {
    expect(buildProfileFromAnswers([])).toEqual({});
  });
});

describe("remainingQuestions", () => {
  it("returns the full bank when nothing has been answered", () => {
    expect(remainingQuestions([])).toHaveLength(BEHAVIORAL_PROFILE_QUESTIONS.length);
  });

  it("excludes questions that already have an answer", () => {
    const remaining = remainingQuestions([{ questionId: "decision_style", value: "analytical" }]);
    expect(remaining.find((q) => q.id === "decision_style")).toBeUndefined();
    expect(remaining).toHaveLength(BEHAVIORAL_PROFILE_QUESTIONS.length - 1);
  });
});
