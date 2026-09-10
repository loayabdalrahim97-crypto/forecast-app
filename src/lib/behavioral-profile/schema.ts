import { z } from "zod";

export const SubmitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .min(1)
    .max(50),
});

export type SubmitAnswersInput = z.infer<typeof SubmitAnswersSchema>;
