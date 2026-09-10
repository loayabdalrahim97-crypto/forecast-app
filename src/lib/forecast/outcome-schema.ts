import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

export const RecordOutcomeSchema = z.object({
  actualOutcome: z.string().min(1).max(4000),
  outcomeDate: z.string().datetime().optional(),
  userResponse: z.string().max(2000).optional(),
  result: z.string().max(2000).optional(),
  locale: z.enum(SUPPORTED_LOCALES).default("en-us"),
});

export type RecordOutcomeInput = z.infer<typeof RecordOutcomeSchema>;
