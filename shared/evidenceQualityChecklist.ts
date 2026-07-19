// ─── Evidence Quality Checklist (free public tool) ──────────────────────────
// Pure data + scoring for the standalone /tools/evidence-engine/ page's
// interactive island. Walks through the same six questions taught in the
// page's "How to read evidence quality" section and produces a plain-language
// read on how traceable and well-supported a claim's SOURCING looks.
//
// This is deliberately NOT a verdict on whether a claim is true or a
// treatment is safe, and it never tells anyone to disregard a clinician —
// see CHECKLIST_DISCLAIMER and the BAND_COPY wording below. Nothing here
// touches the network; scoring is pure arithmetic on answers held in memory.

export type ChecklistAnswer = "yes" | "unsure" | "no";

export interface ChecklistQuestion {
  id: string;
  question: string;
}

export const CHECKLIST_QUESTIONS: ReadonlyArray<ChecklistQuestion> = [
  {
    id: "traceable",
    question: "Can you trace this claim back to a named study, guideline, or expert — not just someone's summary of one?",
  },
  {
    id: "studyType",
    question: "Is it based on a controlled trial or a large study, rather than a single personal story?",
  },
  {
    id: "sampleSize",
    question: "Was it a reasonably large study — do you know roughly how many people it was based on?",
  },
  {
    id: "replicated",
    question: "Has this finding been repeated by other, independent researchers — not just the one source you found?",
  },
  {
    id: "conflictOfInterest",
    question: "Is the source independent of whoever profits if you believe the claim?",
  },
  {
    id: "current",
    question: "Is this current — has it been reviewed or updated recently, rather than being several years old?",
  },
];

export const ANSWER_OPTIONS: ReadonlyArray<{ value: ChecklistAnswer; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "unsure", label: "Not sure" },
  { value: "no", label: "No" },
];

export type ChecklistAnswers = Partial<Record<string, ChecklistAnswer>>;

export type ChecklistBand = "strong" | "mixed" | "unclear";

export interface ChecklistResult {
  answeredCount: number;
  totalQuestions: number;
  isComplete: boolean;
  yesCount: number;
  unsureCount: number;
  noCount: number;
  band: ChecklistBand | null;
  heading: string | null;
  description: string | null;
}

// Shown alongside every result, every time — not just once in a footer.
// Keeps the tool a read on sourcing quality, never a judgement on truth or
// safety, and never a reason to disregard what a clinician has said.
export const CHECKLIST_DISCLAIMER =
  "This is a read on how traceable and well-supported the sourcing looks — not a judgement on whether the claim is true, or whether any treatment is safe. It doesn't evaluate anything a clinician has told you personally; if this relates to your care, it's worth raising directly with them.";

interface BandCopy {
  heading: string;
  description: string;
}

const BAND_COPY: Record<ChecklistBand, BandCopy> = {
  strong: {
    heading: "Well-sourced, as far as you can tell",
    description:
      "Based on your answers, this claim points to a traceable source, a reasonably designed study, and independent confirmation. That's a good sign about the sourcing — it isn't a guarantee the claim applies to your situation. If it relates to a treatment, that's still worth raising with a clinician who knows your history.",
  },
  mixed: {
    heading: "Mixed signals",
    description:
      "Some parts of this claim check out; others don't yet. That doesn't mean it's false — it means there are specific gaps worth closing. A reasonable next step is asking directly, of a clinician or the original source: \"what's this based on, and has it been confirmed elsewhere?\"",
  },
  unclear: {
    heading: "Hard to verify from what's available",
    description:
      "Based on your answers, you weren't able to confirm much about where this claim comes from. That's not proof it's wrong — plenty of true things are poorly sourced in how they're presented online — but it's worth asking about before treating it as settled, including with your own clinician if it relates to your care.",
  },
};

function bandForYesCount(yesCount: number): ChecklistBand {
  if (yesCount >= 5) return "strong";
  if (yesCount >= 2) return "mixed";
  return "unclear";
}

/**
 * Pure scoring function so it can be unit tested independently of the DOM.
 * Requires every question to be answered before returning a band — a
 * partial answer set only reports progress, not a read.
 */
export function scoreChecklist(answers: ChecklistAnswers): ChecklistResult {
  const totalQuestions = CHECKLIST_QUESTIONS.length;
  const answered = CHECKLIST_QUESTIONS.map(q => answers[q.id]).filter(
    (a): a is ChecklistAnswer => a !== undefined
  );
  const answeredCount = answered.length;
  const isComplete = answeredCount === totalQuestions;

  const yesCount = answered.filter(a => a === "yes").length;
  const unsureCount = answered.filter(a => a === "unsure").length;
  const noCount = answered.filter(a => a === "no").length;

  if (!isComplete) {
    return {
      answeredCount,
      totalQuestions,
      isComplete,
      yesCount,
      unsureCount,
      noCount,
      band: null,
      heading: null,
      description: null,
    };
  }

  const band = bandForYesCount(yesCount);
  const { heading, description } = BAND_COPY[band];

  return {
    answeredCount,
    totalQuestions,
    isComplete,
    yesCount,
    unsureCount,
    noCount,
    band,
    heading,
    description,
  };
}
