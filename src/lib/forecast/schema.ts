import { z } from "zod";

export const CreateForecastSchema = z.object({
  situationText: z.string().min(1).max(4000),
});

export type CreateForecastInput = z.infer<typeof CreateForecastSchema>;
