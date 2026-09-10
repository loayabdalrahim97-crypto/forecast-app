import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  BUSINESS_ANALYSIS_SYSTEM_PROMPT_V1,
  buildBusinessAnalysisUserPrompt,
} from "@/lib/ai/prompts/business-analysis";
import { BusinessAnalysisOutputSchema } from "@/lib/ai/schemas/scenario";
import { languageNameForLocale } from "@/lib/i18n/config";
import type { z } from "zod";

export type BusinessAnalysisOutput = z.infer<typeof BusinessAnalysisOutputSchema>;

export async function analyzeBusiness(situationText: string, locale: string) {
  const languageName = languageNameForLocale(locale);
  return AIOrchestrator.run<BusinessAnalysisOutput>({
    requestType: "business_analysis",
    systemPrompt: BUSINESS_ANALYSIS_SYSTEM_PROMPT_V1,
    userPrompt: buildBusinessAnalysisUserPrompt(situationText, languageName),
    schema: BusinessAnalysisOutputSchema,
    maxOutputTokens: 2048,
  });
}
