import { describe, expect, it } from "vitest";
import {
  ANSWER_OPTIONS,
  CHECKLIST_DISCLAIMER,
  CHECKLIST_QUESTIONS,
  scoreChecklist,
  type ChecklistAnswers,
} from "../shared/evidenceQualityChecklist";

describe("evidence quality checklist — structure", () => {
  it("has exactly 6 questions with unique ids", () => {
    expect(CHECKLIST_QUESTIONS).toHaveLength(6);
    const ids = new Set(CHECKLIST_QUESTIONS.map(q => q.id));
    expect(ids.size).toBe(6);
  });

  it("offers yes / not sure / no as the only answers", () => {
    expect(ANSWER_OPTIONS.map(o => o.value)).toEqual(["yes", "unsure", "no"]);
  });
});

describe("evidence quality checklist — completeness", () => {
  it("reports incomplete and no band when questions are unanswered", () => {
    const answers: ChecklistAnswers = { traceable: "yes" };
    const result = scoreChecklist(answers);
    expect(result.isComplete).toBe(false);
    expect(result.answeredCount).toBe(1);
    expect(result.totalQuestions).toBe(6);
    expect(result.band).toBeNull();
    expect(result.heading).toBeNull();
    expect(result.description).toBeNull();
  });

  it("reports complete once every question has an answer", () => {
    const answers: ChecklistAnswers = {
      traceable: "yes",
      studyType: "yes",
      sampleSize: "unsure",
      replicated: "no",
      conflictOfInterest: "no",
      current: "unsure",
    };
    const result = scoreChecklist(answers);
    expect(result.isComplete).toBe(true);
    expect(result.answeredCount).toBe(6);
  });

  it("ignores answer keys that aren't real questions", () => {
    const answers: ChecklistAnswers = {
      traceable: "yes",
      studyType: "yes",
      sampleSize: "yes",
      replicated: "yes",
      conflictOfInterest: "yes",
      current: "yes",
      somethingElse: "yes",
    };
    const result = scoreChecklist(answers);
    expect(result.answeredCount).toBe(6);
    expect(result.isComplete).toBe(true);
  });
});

describe("evidence quality checklist — scoring bands", () => {
  const allAnswered = (value: ChecklistAnswers[string]): ChecklistAnswers =>
    Object.fromEntries(CHECKLIST_QUESTIONS.map(q => [q.id, value]));

  it("bands 6 yes answers as strong", () => {
    const result = scoreChecklist(allAnswered("yes"));
    expect(result.yesCount).toBe(6);
    expect(result.band).toBe("strong");
  });

  it("bands exactly 5 yes answers as strong (lower boundary)", () => {
    const answers = allAnswered("no");
    answers.traceable = "yes";
    answers.studyType = "yes";
    answers.sampleSize = "yes";
    answers.replicated = "yes";
    answers.conflictOfInterest = "yes";
    const result = scoreChecklist(answers);
    expect(result.yesCount).toBe(5);
    expect(result.band).toBe("strong");
  });

  it("bands exactly 4 yes answers as mixed (upper boundary)", () => {
    const answers = allAnswered("no");
    answers.traceable = "yes";
    answers.studyType = "yes";
    answers.sampleSize = "yes";
    answers.replicated = "yes";
    const result = scoreChecklist(answers);
    expect(result.yesCount).toBe(4);
    expect(result.band).toBe("mixed");
  });

  it("bands exactly 2 yes answers as mixed (lower boundary)", () => {
    const answers = allAnswered("no");
    answers.traceable = "yes";
    answers.studyType = "yes";
    const result = scoreChecklist(answers);
    expect(result.yesCount).toBe(2);
    expect(result.band).toBe("mixed");
  });

  it("bands exactly 1 yes answer as unclear (upper boundary)", () => {
    const answers = allAnswered("no");
    answers.traceable = "yes";
    const result = scoreChecklist(answers);
    expect(result.yesCount).toBe(1);
    expect(result.band).toBe("unclear");
  });

  it("bands 0 yes answers as unclear", () => {
    const result = scoreChecklist(allAnswered("no"));
    expect(result.yesCount).toBe(0);
    expect(result.band).toBe("unclear");
  });

  it("bands all-unsure answers as unclear, since unsure isn't a positive signal", () => {
    const result = scoreChecklist(allAnswered("unsure"));
    expect(result.yesCount).toBe(0);
    expect(result.unsureCount).toBe(6);
    expect(result.band).toBe("unclear");
  });

  it("every band has a non-empty heading and description", () => {
    for (const value of ["yes", "unsure", "no"] as const) {
      const result = scoreChecklist(allAnswered(value));
      expect(result.heading).toBeTruthy();
      expect(result.description).toBeTruthy();
    }
  });
});

describe("evidence quality checklist — tone constraints", () => {
  // Founder-mandated constraints: the result must never read as a verdict on
  // whether a claim is true or a treatment is safe, and must never tell
  // someone to disregard their clinician. These are regression tests against
  // that requirement, not just a style preference.
  const forbiddenPhrases = [
    /disregard/i,
    /ignore your (doctor|clinician|gp)/i,
    /this is (false|wrong|incorrect)/i,
    /the claim is (false|wrong|incorrect)/i,
    /don't trust your (doctor|clinician|gp)/i,
  ];

  it("the disclaimer never renders as a truth or safety verdict", () => {
    expect(CHECKLIST_DISCLAIMER).toMatch(/not a judgement on whether the claim is true/i);
    expect(CHECKLIST_DISCLAIMER).toMatch(/whether any treatment is safe/i);
    for (const phrase of forbiddenPhrases) {
      expect(CHECKLIST_DISCLAIMER).not.toMatch(phrase);
    }
  });

  it("no band's heading or description contains a truth/safety verdict or anti-clinician language", () => {
    const bands: ChecklistAnswers[string][] = ["yes", "unsure", "no"];
    for (const value of bands) {
      const answers = Object.fromEntries(CHECKLIST_QUESTIONS.map(q => [q.id, value])) as ChecklistAnswers;
      const result = scoreChecklist(answers);
      const text = `${result.heading} ${result.description}`;
      for (const phrase of forbiddenPhrases) {
        expect(text, `band text: "${text}"`).not.toMatch(phrase);
      }
    }
  });

  it("the lowest band nudges toward asking, not toward rejecting the claim", () => {
    const result = scoreChecklist(
      Object.fromEntries(CHECKLIST_QUESTIONS.map(q => [q.id, "no"])) as ChecklistAnswers
    );
    expect(result.description).toMatch(/worth asking|worth checking|worth raising/i);
  });
});
