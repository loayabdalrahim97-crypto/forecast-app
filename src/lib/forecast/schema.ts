import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

export const CreateForecastSchema = z.object({
  situationText: z.string().min(1).max(4000),
  locale: z.enum(SUPPORTED_LOCALES).default("en-us"),
});

export type CreateForecastInput = z.infer<typeof CreateForecastSchema>;
