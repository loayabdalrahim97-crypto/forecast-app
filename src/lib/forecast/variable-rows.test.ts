import { describe, expect, it } from "vitest";
import { analysisToVariableRows, groupVariablesByKind } from "./variable-rows";
import type { SituationAnalysis } from "./analyze-situation";

const baseAnalysis: SituationAnalysis = {
  facts: [],
  assumptions: [],
  unknowns: [],
  keyVariables: [],
  behavioralVariables: [],
  externalVariables: [],
  controllableVariables: [],
  uncontrollableVariables: [],
};

describe("analysisToVariableRows", () => {
  it("maps facts and assumptions to distinct kinds, never merged", () => {
    const rows = analysisToVariableRows({
      ...baseAnalysis,
      facts: ["Manager requested a meeting."],
      assumptions: ["The manager intends to fire the user."],
    });
    expect(rows).toContainEqual({ kind: "fact", content: "Manager requested a meeting." });
    expect(rows).toContainEqual({
      kind: "assumption",
      content: "The manager intends to fire the user.",
    });
  });

  it("produces one row per item, preserving all categories", () => {
    const rows = analysisToVariableRows({
      ...baseAnalysis,
      facts: ["Fact 1", "Fact 2"],
      unknowns: ["Unknown 1"],
      behavioralVariables: ["Tends to assume the worst"],
      externalVariables: ["Market conditions"],
      controllableVariables: ["How the user responds"],
      uncontrollableVariables: ["What the other person decides"],
    });
    expect(rows).toHaveLength(7);
  });

  it("omits keyVariables — it's a derived summary, not a distinct evidentiary category", () => {
    const rows = analysisToVariableRows({
      ...baseAnalysis,
      keyVariables: ["Something that would otherwise duplicate other rows"],
    });
    expect(rows).toHaveLength(0);
  });

  it("returns an empty array for an entirely empty analysis", () => {
    expect(analysisToVariableRows(baseAnalysis)).toEqual([]);
  });
});

describe("groupVariablesByKind", () => {
  it("regroups rows back into flat lists by kind", () => {
    const grouped = groupVariablesByKind([
      { kind: "fact", content: "Fact A" },
      { kind: "assumption", content: "Assumption A" },
      { kind: "fact", content: "Fact B" },
    ]);
    expect(grouped.facts).toEqual(["Fact A", "Fact B"]);
    expect(grouped.assumptions).toEqual(["Assumption A"]);
    expect(grouped.unknowns).toEqual([]);
  });

  it("ignores kinds it doesn't group (controllable/uncontrollable) without throwing", () => {
    const grouped = groupVariablesByKind([
      { kind: "controllable", content: "X" },
      { kind: "fact", content: "Y" },
    ]);
    expect(grouped.facts).toEqual(["Y"]);
  });
});
