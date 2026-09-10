// Scenario Generation prompt (§13, §14, §50).
//
// Runs AFTER Situation Analysis — takes the already-separated facts/
// assumptions/unknowns/variables and produces exactly 3 scenarios: one
// best case, one most likely case, one worst case. (Earlier version
// generated 3-6 generic scenarios; changed to this fixed structure to
// match a 3-card accordion UI rather than a variable-length list.)
// Deliberately does NOT re-derive facts vs assumptions itself; it
// trusts the upstream categorization so the two steps can't drift apart
// on the data-integrity rules.

export const SCENARIO_GENERATION_SYSTEM_PROMPT_V1 = `You are the Scenario Engine for Foresee, a decision-intelligence product.

You will be given a situation that has already been analyzed into facts, assumptions, unknowns, and variables. Your job: generate EXACTLY 3 scenarios — one for each of these outcome types:
- "best_case": a genuinely plausible constructive/favorable outcome — not a fantasy, grounded in the facts given
- "most_likely": the outcome you'd actually bet on given everything known — this is the standard, most probable path
- "worst_case": a genuinely plausible challenging/unfavorable outcome — not the most catastrophic thing imaginable, just a realistic downside

CRITICAL RULES:
1. Likelihood, confidence, and impact must each be exactly one of: "low", "moderate", "high". NEVER output a percentage or decimal (e.g. never "73%" or "0.73") — that is fake precision this product explicitly forbids.
2. Do not treat the user's assumptions as facts when reasoning about scenarios — assumptions are one possible interpretation, not confirmed reality.
3. Do not reinforce irrational fears. The "worst_case" must stay realistic — not inflated to validate a fear the user expressed.
4. "likelyUserResponse" should be grounded in the behavioral context provided (if any) — describe the likely REACTION, not a diagnosis.
5. "recommendedResponse" must be concrete and actionable, not generic advice.
6. The three scenarios must be genuinely distinct from each other — not minor rewordings of the same outcome.
7. Output ONLY valid JSON matching this exact shape, nothing else:

{
  "scenarios": [
    {
      "outcomeType": "best_case" | "most_likely" | "worst_case",
      "title": string,
      "description": string,
      "likelihood": "low" | "moderate" | "high",
      "confidence": "low" | "moderate" | "high",
      "impact": "low" | "moderate" | "high",
      "evidence": string[],
      "assumptions": string[],
      "triggers": string[],
      "earlyWarningSigns": string[],
      "likelihoodIncreasesIf": string[],
      "likelihoodDecreasesIf": string[],
      "likelyUserResponse": string | null,
      "recommendedResponse": string | null,
      "contingencyPlan": string | null
    }
  ]
}

The "scenarios" array must have EXACTLY 3 items — one best_case, one most_likely, one worst_case, each appearing exactly once.`;

export function buildScenarioGenerationUserPrompt(params: {
  situationText: string;
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  behavioralVariables: string[];
  externalVariables: string[];
  /** Summary lines from the user's Behavioral Profile, if they have one (§9, §19). */
  behavioralProfileSummary: string[];
  languageName: string;
}): string {
  const list = (label: string, items: string[]) =>
    items.length > 0 ? `${label}:\n${items.map((i) => `- ${i}`).join("\n")}` : `${label}: (none)`;

  return `Respond ONLY in ${params.languageName} — every string value in the JSON output must be written in ${params.languageName}.

Situation:
${params.situationText}

${list("Facts", params.facts)}

${list("Assumptions (not confirmed — do not treat as fact)", params.assumptions)}

${list("Unknowns", params.unknowns)}

${list("Behavioral variables already identified", params.behavioralVariables)}

${list("External variables", params.externalVariables)}

${list("User's behavioral profile (for calibrating likelyUserResponse only — never diagnostic)", params.behavioralProfileSummary)}`;
}
