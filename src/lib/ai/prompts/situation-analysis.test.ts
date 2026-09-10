import { describe, expect, it } from "vitest";
import {
  buildSituationAnalysisUserPrompt,
  buildFollowUpQuestionsUserPrompt,
} from "./situation-analysis";

describe("buildSituationAnalysisUserPrompt", () => {
  it("includes the full situation text verbatim", () => {
    const prompt = buildSituationAnalysisUserPrompt("My manager asked to meet tomorrow.");
    expect(prompt).toContain("My manager asked to meet tomorrow.");
  });
});

describe("buildFollowUpQuestionsUserPrompt", () => {
  it("lists each unknown on its own line", () => {
    const prompt = buildFollowUpQuestionsUserPrompt({
      situationText: "Situation X",
      unknowns: ["Reason for the meeting", "Whether this has happened before"],
    });
    expect(prompt).toContain("- Reason for the meeting");
    expect(prompt).toContain("- Whether this has happened before");
  });

  it("shows a placeholder when there are no unknowns", () => {
    const prompt = buildFollowUpQuestionsUserPrompt({
      situationText: "Situation X",
      unknowns: [],
    });
    expect(prompt).toContain("(none)");
  });
});
