import { describe, expect, it } from "vitest";
import { summarizeBehavioralProfile } from "./behavioral-summary";

describe("summarizeBehavioralProfile", () => {
  it("returns an empty array for no profile", () => {
    expect(summarizeBehavioralProfile(null)).toEqual([]);
  });

  it("includes answered scalar attributes with readable labels", () => {
    const lines = summarizeBehavioralProfile({ decisionStyle: "analytical" });
    expect(lines).toContain("Decision style: analytical");
  });

  it("omits unanswered attributes rather than guessing", () => {
    const lines = summarizeBehavioralProfile({ decisionStyle: "analytical" });
    expect(lines.some((l) => l.startsWith("Risk tolerance"))).toBe(false);
  });

  it("phrases tendency flags behaviorally, never as a diagnosis", () => {
    const lines = summarizeBehavioralProfile({ negativeInterpretationTendency: true });
    expect(lines).toContain("User tends to interpret ambiguous situations negatively.");
    expect(lines.join(" ")).not.toMatch(/anxiety|disorder|diagnosis/i);
  });

  it("omits a tendency flag that is false or unset", () => {
    const lines = summarizeBehavioralProfile({ overthinkingTendency: false });
    expect(lines).toEqual([]);
  });

  it("combines multiple answered fields", () => {
    const lines = summarizeBehavioralProfile({
      riskTolerance: "high",
      catastrophizingTendency: true,
    });
    expect(lines).toHaveLength(2);
  });
});
