import "@/index.css";
import {
  GREENE_ITEMS,
  GREENE_RESPONSE_OPTIONS,
  GREENE_SUBSCALE_MAX,
  findMissingItems,
  scoreGreeneClimactericScale,
  describeRelativeLevel,
  type GreeneResponses,
  type GreeneResponseValue,
  type GreeneScoreResult,
} from "@shared/greeneClimactericScale";

// Progressive enhancement only: the 21 items and their radio inputs already
// exist in the static HTML and work with plain HTML form validation with no
// JS at all. This script adds live progress, gentle validation, client-side
// scoring, and the results/print views. Nothing here ever calls fetch/XHR —
// every calculation stays in the browser.

const form = document.querySelector<HTMLFormElement>("#greene-form")!;
const progressText = document.querySelector<HTMLElement>("#greene-progress-text")!;
const progressBar = document.querySelector<HTMLElement>("#greene-progress-bar")!;
const missingWarning = document.querySelector<HTMLElement>("#greene-missing-warning")!;
const resultsSection = document.querySelector<HTMLElement>("#greene-results")!;
const resultsSummary = document.querySelector<HTMLElement>("#greene-results-summary")!;
const resultsBars = document.querySelector<HTMLElement>("#greene-results-bars")!;
const printSummary = document.querySelector<HTMLElement>("#greene-print-summary")!;
const printBtn = document.querySelector<HTMLButtonElement>("#greene-print-btn")!;
const editBtn = document.querySelector<HTMLButtonElement>("#greene-edit-btn")!;

const TOTAL_ITEMS = GREENE_ITEMS.length;

interface SubscaleDisplay {
  label: string;
  score: number;
  max: number;
  description: string;
}

function readResponses(): GreeneResponses {
  const responses: GreeneResponses = {};
  for (const item of GREENE_ITEMS) {
    const checked = form.querySelector<HTMLInputElement>(`input[name="item-${item.id}"]:checked`);
    if (checked) {
      responses[item.id] = Number(checked.value) as GreeneResponseValue;
    }
  }
  return responses;
}

function updateProgress(): void {
  const responses = readResponses();
  const answered = TOTAL_ITEMS - findMissingItems(responses).length;
  progressText.textContent = `${answered} of ${TOTAL_ITEMS} answered`;
  progressBar.style.width = `${Math.round((answered / TOTAL_ITEMS) * 100)}%`;
}

function clearMissingHighlights(): void {
  form.querySelectorAll(".greene-item").forEach(el => {
    el.classList.remove("border-[#c07060]", "bg-[#faf5f3]");
  });
}

function highlightMissing(missingIds: number[]): void {
  for (const id of missingIds) {
    form.querySelector(`.greene-item[data-item-id="${id}"]`)?.classList.add("border-[#c07060]", "bg-[#faf5f3]");
  }
}

function buildSubscales(score: GreeneScoreResult): SubscaleDisplay[] {
  return [
    {
      label: "Psychological",
      score: score.psychological,
      max: GREENE_SUBSCALE_MAX.psychological,
      description:
        "Anxiety and low mood — a racing heart, feeling tense or on edge, panic, difficulty concentrating, tiredness, loss of interest, and tearfulness.",
    },
    {
      label: "Somatic",
      score: score.somatic,
      max: GREENE_SUBSCALE_MAX.somatic,
      description:
        "Physical body symptoms — dizziness, head pressure, numbness or tingling, headaches, joint and muscle pain, and breathing difficulty.",
    },
    {
      label: "Vasomotor",
      score: score.vasomotor,
      max: GREENE_SUBSCALE_MAX.vasomotor,
      description: "Hot flushes and night sweats — the symptoms most classically linked to perimenopause and menopause.",
    },
    {
      label: "Sexual Function",
      score: score.sexual,
      max: GREENE_SUBSCALE_MAX.sexual,
      description: "A single question about interest in sex, reported on its own rather than added to the total.",
    },
  ];
}

function renderResultsBars(subscales: SubscaleDisplay[]): void {
  resultsBars.innerHTML = "";
  for (const sub of subscales) {
    const pct = sub.max === 0 ? 0 : Math.round((sub.score / sub.max) * 100);
    const row = document.createElement("div");
    row.innerHTML = `
      <div class="flex items-baseline justify-between text-sm">
        <span class="font-semibold text-[#1a2b22]">${sub.label}</span>
        <span class="font-mono text-xs text-[#6b7a72]">${sub.score} / ${sub.max}</span>
      </div>
      <div class="mt-1.5 h-2 rounded-full bg-[#eae5de] overflow-hidden">
        <div class="h-full rounded-full bg-[#4a8a72]" style="width: ${pct}%"></div>
      </div>
      <p class="mt-1.5 text-xs text-[#6b7a72] leading-relaxed">${sub.description}</p>
    `;
    resultsBars.appendChild(row);
  }
}

function renderPrintSummary(score: GreeneScoreResult, responses: GreeneResponses, subscales: SubscaleDisplay[]): void {
  const completedOn = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const scoreRows = [
    { label: "Total (items 1-20)", score: score.total, max: GREENE_SUBSCALE_MAX.total },
    ...subscales,
  ]
    .map(row => `<tr><td>${row.label}</td><td>${row.score} / ${row.max}</td></tr>`)
    .join("");

  const itemRows = GREENE_ITEMS.map(item => {
    const value = responses[item.id];
    const optionLabel = GREENE_RESPONSE_OPTIONS.find(o => o.value === value)?.label ?? "";
    return `<tr><td>${item.id}. ${item.text}</td><td>${optionLabel} (${value})</td></tr>`;
  }).join("");

  printSummary.innerHTML = `
    <h1>Greene Climacteric Scale — Results Summary</h1>
    <p>Completed ${completedOn} &middot; ripplehealth.app/tools/greene-climacteric-scale</p>
    <h2>Scores</h2>
    <table class="greene-print-table">
      <tr><th>Category</th><th>Score</th></tr>
      ${scoreRows}
    </table>
    <h2>Individual responses</h2>
    <table class="greene-print-table">
      <tr><th>Item</th><th>Response</th></tr>
      ${itemRows}
    </table>
    <p>
      This is a symptom-severity self-assessment, not a diagnosis. Higher scores indicate more severe or more
      frequent symptoms. Please discuss these results with a GP or menopause specialist.
    </p>
  `;
}

function renderResults(score: GreeneScoreResult, responses: GreeneResponses): void {
  const totalLevel = describeRelativeLevel(score.total, GREENE_SUBSCALE_MAX.total);
  resultsSummary.textContent =
    `Your total score is ${score.total} out of ${GREENE_SUBSCALE_MAX.total} — in the ${totalLevel} third of the ` +
    `scale's possible range. This reflects how much these 20 symptoms have affected you recently; it isn't a diagnosis.`;

  const subscales = buildSubscales(score);
  renderResultsBars(subscales);
  renderPrintSummary(score, responses, subscales);
}

form.addEventListener("change", updateProgress);
updateProgress();

form.addEventListener("submit", event => {
  event.preventDefault();

  const responses = readResponses();
  const missing = findMissingItems(responses);
  clearMissingHighlights();

  if (missing.length > 0) {
    missingWarning.textContent = `Please answer all 21 questions — ${missing.length} remaining.`;
    missingWarning.classList.remove("hidden");
    highlightMissing(missing);
    form.querySelector(`.greene-item[data-item-id="${missing[0]}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return;
  }

  missingWarning.classList.add("hidden");
  const score = scoreGreeneClimactericScale(responses);
  renderResults(score, responses);
  resultsSection.classList.remove("hidden");
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

printBtn.addEventListener("click", () => window.print());
editBtn.addEventListener("click", () => form.scrollIntoView({ behavior: "smooth", block: "start" }));
