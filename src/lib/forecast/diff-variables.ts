export interface ForecastDiff {
  addedFacts: string[];
  removedFacts: string[];
  addedAssumptions: string[];
  removedAssumptions: string[];
  addedUnknowns: string[];
  removedUnknowns: string[];
}

function diffList(before: string[], after: string[]): { added: string[]; removed: string[] } {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    added: after.filter((item) => !beforeSet.has(item)),
    removed: before.filter((item) => !afterSet.has(item)),
  };
}

/**
 * §9 (Update Forecast): "Previous Forecast vs Updated Forecast — show
 * what changed." Pure set-difference on the already-categorized
 * facts/assumptions/unknowns — no extra AI call needed, since the
 * upstream analysis already did the hard part of classifying each
 * item correctly.
 */
export function diffForecastVariables(
  before: { facts: string[]; assumptions: string[]; unknowns: string[] },
  after: { facts: string[]; assumptions: string[]; unknowns: string[] }
): ForecastDiff {
  const facts = diffList(before.facts, after.facts);
  const assumptions = diffList(before.assumptions, after.assumptions);
  const unknowns = diffList(before.unknowns, after.unknowns);

  return {
    addedFacts: facts.added,
    removedFacts: facts.removed,
    addedAssumptions: assumptions.added,
    removedAssumptions: assumptions.removed,
    addedUnknowns: unknowns.added,
    removedUnknowns: unknowns.removed,
  };
}

export function isDiffEmpty(diff: ForecastDiff): boolean {
  return (
    diff.addedFacts.length === 0 &&
    diff.removedFacts.length === 0 &&
    diff.addedAssumptions.length === 0 &&
    diff.removedAssumptions.length === 0 &&
    diff.addedUnknowns.length === 0 &&
    diff.removedUnknowns.length === 0
  );
}
