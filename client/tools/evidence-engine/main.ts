import "@/index.css";
import {
  CHECKLIST_DISCLAIMER,
  CHECKLIST_QUESTIONS,
  scoreChecklist,
  type ChecklistAnswer,
  type ChecklistAnswers,
} from "@shared/evidenceQualityChecklist";

// Progressive enhancement only: all six questions already exist as static
// radio inputs in the HTML and are readable with JS off. This script scores
// them once every question is answered. Nothing here ever calls fetch/XHR —
// answers only ever live in this page's JavaScript memory, for the current
// session, and are never transmitted anywhere.

const form = document.querySelector<HTMLFormElement>("#checklist-form")!;
const progressText = document.querySelector<HTMLElement>("#checklist-progress-text")!;
const progressBar = document.querySelector<HTMLElement>("#checklist-progress-bar")!;
const resultBox = document.querySelector<HTMLElement>("#checklist-result")!;
const resultHeading = document.querySelector<HTMLElement>("#checklist-result-heading")!;
const resultDescription = document.querySelector<HTMLElement>("#checklist-result-description")!;
const disclaimerEl = document.querySelector<HTMLElement>("#checklist-disclaimer")!;
const resetBtn = document.querySelector<HTMLButtonElement>("#checklist-reset-btn")!;

disclaimerEl.textContent = ` ${CHECKLIST_DISCLAIMER}`;

function readAnswers(): ChecklistAnswers {
  const answers: ChecklistAnswers = {};
  for (const question of CHECKLIST_QUESTIONS) {
    const checked = form.querySelector<HTMLInputElement>(`input[name="q-${question.id}"]:checked`);
    if (checked) {
      answers[question.id] = checked.value as ChecklistAnswer;
    }
  }
  return answers;
}

function render(): void {
  const answers = readAnswers();
  const result = scoreChecklist(answers);

  progressText.textContent = `${result.answeredCount} of ${result.totalQuestions} answered`;
  progressBar.style.width = `${(result.answeredCount / result.totalQuestions) * 100}%`;

  if (!result.isComplete || !result.heading || !result.description) {
    resultBox.classList.add("hidden");
    return;
  }

  resultHeading.textContent = result.heading;
  resultDescription.textContent = result.description;
  resultBox.classList.remove("hidden");
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.addEventListener("change", render);

resetBtn.addEventListener("click", () => {
  form.reset();
  render();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});
