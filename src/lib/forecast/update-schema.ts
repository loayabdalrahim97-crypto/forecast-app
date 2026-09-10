import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

export const UpdateForecastSchema = z.object({
  additionalInfo: z.string().min(1).max(2000),
  locale: z.enum(SUPPORTED_LOCALES).default("en-us"),
});

export type UpdateForecastInput = z.infer<typeof UpdateForecastSchema>;
