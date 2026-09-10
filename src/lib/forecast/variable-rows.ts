import type { SituationAnalysis } from "./analyze-situation";

export interface ForecastVariableRow {
  kind:
    | "fact"
    | "assumption"
    | "unknown"
    | "behavioral"
    | "external"
    | "controllable"
    | "uncontrollable";
  content: string;
}

const CATEGORY_MAP: Array<{ key: keyof SituationAnalysis; kind: ForecastVariableRow["kind"] }> = [
  { key: "facts", kind: "fact" },
  { key: "assumptions", kind: "assumption" },
  { key: "unknowns", kind: "unknown" },
  { key: "behavioralVariables", kind: "behavioral" },
  { key: "externalVariables", kind: "external" },
  { key: "controllableVariables", kind: "controllable" },
  { key: "uncontrollableVariables", kind: "uncontrollable" },
];

/**
 * Flattens a SituationAnalysis into rows ready for
 * ForecastVariable.createMany. Each category stays a separate row with
 * its own `kind` — this is the structural enforcement of §50 (an
 * assumption can never silently become a fact) at the persistence layer,
 * not just in the prompt.
 *
 * Note: `keyVariables` is intentionally omitted — it's a derived summary
 * of the other categories (§11 lists it as "most likely to influence the
 * outcome"), not a distinct evidentiary category, so persisting it
 * separately would duplicate rows without adding information.
 */
export function analysisToVariableRows(analysis: SituationAnalysis): ForecastVariableRow[] {
  const rows: ForecastVariableRow[] = [];
  for (const { key, kind } of CATEGORY_MAP) {
    for (const content of analysis[key] as string[]) {
      rows.push({ kind, content });
    }
  }
  return rows;
}
