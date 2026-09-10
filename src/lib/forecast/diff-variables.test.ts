import { describe, expect, it } from "vitest";
import { diffForecastVariables, isDiffEmpty } from "./diff-variables";

describe("diffForecastVariables", () => {
  it("detects newly added facts", () => {
    const diff = diffForecastVariables(
      { facts: ["A"], assumptions: [], unknowns: [] },
      { facts: ["A", "B"], assumptions: [], unknowns: [] }
    );
    expect(diff.addedFacts).toEqual(["B"]);
    expect(diff.removedFacts).toEqual([]);
  });

  it("detects removed assumptions (e.g. resolved by new info)", () => {
    const diff = diffForecastVariables(
      { facts: [], assumptions: ["He is upset"], unknowns: [] },
      { facts: [], assumptions: [], unknowns: [] }
    );
    expect(diff.removedAssumptions).toEqual(["He is upset"]);
  });

  it("detects unknowns resolved into facts across categories independently", () => {
    const diff = diffForecastVariables(
      { facts: [], assumptions: [], unknowns: ["Reason for the meeting"] },
      { facts: ["The meeting is about budget cuts"], assumptions: [], unknowns: [] }
    );
    expect(diff.addedFacts).toEqual(["The meeting is about budget cuts"]);
    expect(diff.removedUnknowns).toEqual(["Reason for the meeting"]);
  });

  it("reports no changes when nothing differs", () => {
    const diff = diffForecastVariables(
      { facts: ["A"], assumptions: ["B"], unknowns: ["C"] },
      { facts: ["A"], assumptions: ["B"], unknowns: ["C"] }
    );
    expect(isDiffEmpty(diff)).toBe(true);
  });

  it("reports changes exist when something differs", () => {
    const diff = diffForecastVariables(
      { facts: ["A"], assumptions: [], unknowns: [] },
      { facts: ["A", "B"], assumptions: [], unknowns: [] }
    );
    expect(isDiffEmpty(diff)).toBe(false);
  });
});
