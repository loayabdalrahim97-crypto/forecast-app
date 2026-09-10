import { describe, expect, it } from "vitest";
import { generateFollowUpQuestions } from "./analyze-situation";

describe("generateFollowUpQuestions", () => {
  it("returns an empty question list without calling the AI when there are no unknowns", async () => {
    // No ANTHROPIC_API_KEY is configured in the test environment — if
    // this function tried to call the AI, it would throw. Getting a
    // clean empty result back proves the short-circuit works.
    const result = await generateFollowUpQuestions({
      situationText: "Everything about this is already clear.",
      unknowns: [],
      locale: "en-us",
    });
    expect(result.data.questions).toEqual([]);
    expect(result.meta).toBeNull();
  });
});
