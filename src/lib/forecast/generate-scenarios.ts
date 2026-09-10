import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  SCENARIO_GENERATION_SYSTEM_PROMPT_V1,
  buildScenarioGenerationUserPrompt,
} from "@/lib/ai/prompts/scenario-generation";
import { ScenarioGenerationOutputSchema } from "@/lib/ai/schemas/scenario";
import { languageNameForLocale } from "@/lib/i18n/config";
import type { z } from "zod";

export type ScenarioGenerationOutput = z.infer<typeof ScenarioGenerationOutputSchema>;

export async function generateScenarios(params: {
  situationText: string;
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  behavioralVariables: string[];
  externalVariables: string[];
  behavioralProfileSummary: string[];
  locale: string;
}) {
  const languageName = languageNameForLocale(params.locale);
  return AIOrchestrator.run<ScenarioGenerationOutput>({
    requestType: "scenario_generation",
    systemPrompt: SCENARIO_GENERATION_SYSTEM_PROMPT_V1,
    userPrompt: buildScenarioGenerationUserPrompt({ ...params, languageName }),
    schema: ScenarioGenerationOutputSchema,
    // 3-6 scenarios, each with title/description/evidence/triggers/
    // earlyWarningSigns/likelihoodIncreasesIf/likelihoodDecreasesIf/
    // likelyUserResponse/recommendedResponse/contingencyPlan, adds up
    // fast — 2048 was cutting the response off mid-JSON (confirmed via
    // the AIValidationError raw output in production logs).
    maxOutputTokens: 4096,
  });
}
