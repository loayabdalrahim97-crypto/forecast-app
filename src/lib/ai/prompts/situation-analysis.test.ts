import { describe, expect, it } from "vitest";
import {
  buildSituationAnalysisUserPrompt,
  buildFollowUpQuestionsUserPrompt,
} from "./situation-analysis";

describe("buildSituationAnalysisUserPrompt", () => {
  it("includes the full situation text verbatim", () => {
    const prompt = buildSituationAnalysisUserPrompt(
      "My manager asked to meet tomorrow.",
      "English"
    );
    expect(prompt).toContain("My manager asked to meet tomorrow.");
  });

  it("instructs the model to respond in the given language regardless of input language (section 3)", () => {
    const prompt = buildSituationAnalysisUserPrompt("امي حكتلي انو ما بتحبني", "Arabic");
    expect(prompt).toContain("Respond ONLY in Arabic");
    expect(prompt).toContain("امي حكتلي انو ما بتحبني");
  });
});

describe("buildFollowUpQuestionsUserPrompt", () => {
  it("lists each unknown on its own line", () => {
    const prompt = buildFollowUpQuestionsUserPrompt({
      situationText: "Situation X",
      unknowns: ["Reason for the meeting", "Whether this has happened before"],
      languageName: "English",
    });
    expect(prompt).toContain("- Reason for the meeting");
    expect(prompt).toContain("- Whether this has happened before");
  });

  it("shows a placeholder when there are no unknowns", () => {
    const prompt = buildFollowUpQuestionsUserPrompt({
      situationText: "Situation X",
      unknowns: [],
      languageName: "English",
    });
    expect(prompt).toContain("(none)");
  });

  it("instructs the model to respond in the given language", () => {
    const prompt = buildFollowUpQuestionsUserPrompt({
      situationText: "Situation X",
      unknowns: ["Something"],
      languageName: "German",
    });
    expect(prompt).toContain("Respond ONLY in German");
  });
});
