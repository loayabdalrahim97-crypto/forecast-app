import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  SITUATION_ANALYSIS_SYSTEM_PROMPT_V1,
  buildSituationAnalysisUserPrompt,
  FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT_V1,
  buildFollowUpQuestionsUserPrompt,
} from "@/lib/ai/prompts/situation-analysis";
import { SituationAnalysisSchema, FollowUpQuestionsSchema } from "@/lib/ai/schemas/scenario";
import { languageNameForLocale } from "@/lib/i18n/config";
import type { z } from "zod";

export type SituationAnalysis = z.infer<typeof SituationAnalysisSchema>;

/**
 * §3: "AI responses must use the user's selected language" — not the
 * language the user happened to type in. `locale` is the site locale
 * (e.g. "ar", "en-us"), resolved by the caller the same way any other
 * page content is.
 */
export async function analyzeSituation(situationText: string, locale: string) {
  const languageName = languageNameForLocale(locale);
  return AIOrchestrator.run<SituationAnalysis>({
    requestType: "situation_analysis",
    systemPrompt: SITUATION_ANALYSIS_SYSTEM_PROMPT_V1,
    userPrompt: buildSituationAnalysisUserPrompt(situationText, languageName),
    schema: SituationAnalysisSchema,
    maxOutputTokens: 1024,
  });
}

/**
 * §12: only call this when there's a real chance the unknowns matter.
 * Skipping the call entirely when there are no unknowns saves a request
 * (§22 cost control) — the model doesn't need to be asked to confirm
 * "no questions" when we already know there's nothing to ask about.
 */
export async function generateFollowUpQuestions(params: {
  situationText: string;
  unknowns: string[];
  locale: string;
}) {
  if (params.unknowns.length === 0) {
    return { data: { questions: [] as string[] }, meta: null };
  }

  const languageName = languageNameForLocale(params.locale);
  return AIOrchestrator.run<{ questions: string[] }>({
    requestType: "question_generation",
    systemPrompt: FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT_V1,
    userPrompt: buildFollowUpQuestionsUserPrompt({
      situationText: params.situationText,
      unknowns: params.unknowns,
      languageName,
    }),
    schema: FollowUpQuestionsSchema,
    maxOutputTokens: 512,
  });
}
