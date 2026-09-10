import { AIOrchestrator } from "@/lib/ai/orchestrator";
import {
  SITUATION_ANALYSIS_SYSTEM_PROMPT_V1,
  buildSituationAnalysisUserPrompt,
  FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT_V1,
  buildFollowUpQuestionsUserPrompt,
} from "@/lib/ai/prompts/situation-analysis";
import { SituationAnalysisSchema, FollowUpQuestionsSchema } from "@/lib/ai/schemas/scenario";
import type { z } from "zod";

export type SituationAnalysis = z.infer<typeof SituationAnalysisSchema>;

export async function analyzeSituation(situationText: string) {
  return AIOrchestrator.run<SituationAnalysis>({
    requestType: "situation_analysis",
    systemPrompt: SITUATION_ANALYSIS_SYSTEM_PROMPT_V1,
    userPrompt: buildSituationAnalysisUserPrompt(situationText),
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
}) {
  if (params.unknowns.length === 0) {
    return { data: { questions: [] as string[] }, meta: null };
  }

  return AIOrchestrator.run<{ questions: string[] }>({
    requestType: "question_generation",
    systemPrompt: FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT_V1,
    userPrompt: buildFollowUpQuestionsUserPrompt(params),
    schema: FollowUpQuestionsSchema,
    maxOutputTokens: 512,
  });
}
