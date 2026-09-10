import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  PERSONALIZATION_ANALYSIS_SYSTEM_PROMPT_V1,
  buildPersonalizationAnalysisUserPrompt,
} from "@/lib/ai/prompts/personalization-analysis";
import { PersonalizationInsightsSchema } from "@/lib/ai/schemas/scenario";
import { languageNameForLocale } from "@/lib/i18n/config";
import { hasEnoughDataForPersonalization } from "./data-gate";
import type { z } from "zod";

export type PersonalizationInsights = z.infer<typeof PersonalizationInsightsSchema>;

export async function analyzePersonalization(params: {
  history: Array<{ situationText: string; assumptions: string[]; wrongAssumptions: string[] }>;
  locale: string;
}) {
  // §19 gate: never draw conclusions from too little history. Returning
  // early here (rather than letting the prompt's own "only if it
  // recurs" instruction be the only safeguard) means this is enforced
  // in code, not just in a prompt the model could deviate from.
  if (!hasEnoughDataForPersonalization(params.history.length)) {
    return { data: { insights: [] as PersonalizationInsights["insights"] }, meta: null };
  }

  const languageName = languageNameForLocale(params.locale);
  return AIOrchestrator.run<PersonalizationInsights>({
    requestType: "personalization_analysis",
    systemPrompt: PERSONALIZATION_ANALYSIS_SYSTEM_PROMPT_V1,
    userPrompt: buildPersonalizationAnalysisUserPrompt({ ...params, languageName }),
    schema: PersonalizationInsightsSchema,
    maxOutputTokens: 1024,
  });
}
