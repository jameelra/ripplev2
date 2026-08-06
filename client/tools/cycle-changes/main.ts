import "@/index.css";
import {
  classifyPattern,
  getDescriptiveNotes,
  hasPersistentBleedingFlag,
  isConfounderGateActive,
  PATTERN,
  GATE_YES,
  FLAG_NONE,
  type CycleChangeResponses,
} from "./pattern.js";

// Progressive enhancement only: all 8 items and their inputs already exist in
// the static HTML and work with plain HTML form structure with no JS at all.
// This script adds gate-aware dimming, "None of these" exclusivity, missing-
// answer validation, client-side classification, and the results/print
// views. Nothing here ever calls fetch/XHR — every calculation stays in the
// browser, and nothing is persisted between visits.

const form = document.querySelector<HTMLFormElement>("#cycle-form")!;
const missingWarning = document.querySelector<HTMLElement>("#cycle-missing-warning")!;
const classificationSection = document.querySelector<HTMLElement>("#cycle-classification-section")!;
const gateNote = document.querySelector<HTMLElement>("#cycle-gate-note")!;

const resultsSection = document.querySelector<HTMLElement>("#cycle-results")!;
const flagPanel = document.querySelector<HTMLElement>("#cycle-flag-panel")!;
const gatedResult = document.querySelector<HTMLElement>("#cycle-gated-result")!;
const patternResult = document.querySelector<HTMLElement>("#cycle-pattern-result")!;
const patternHeading = document.querySelector<HTMLElement>("#cycle-pattern-heading")!;
const patternBody = document.querySelector<HTMLElement>("#cycle-pattern-body")!;
const patternNotes = document.querySelector<HTMLElement>("#cycle-pattern-notes")!;
const printSummary = document.querySelector<HTMLElement>("#cycle-print-summary")!;
const printBtn = document.querySelector<HTMLButtonElement>("#cycle-print-btn")!;
const editBtn = document.querySelector<HTMLButtonElement>("#cycle-edit-btn")!;

const item7Checkboxes = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="item7"]'));
const item7None = item7Checkboxes.find(cb => cb.value === FLAG_NONE)!;

const HONESTY_CAVEAT =
  "Cycle changes are only one signal. Some women see little or no change in cycle length before their final " +
  "menses, so a steady cycle doesn't rule out the transition.";

const GATE_MESSAGE =
  "Hormonal treatments change bleeding patterns directly, so cycle timing can't tell you much about where you " +
  "are in the transition while you're using them. The symptom-based tools below may be more useful, and this is " +
  "worth raising with your clinician.";

const FLAG_PANEL_TEXT =
  "Some of what you've described is worth raising with a clinician sooner rather than later — not because it's " +
  "necessarily serious, but because these are patterns that are usually checked rather than watched. Bleeding " +
  "after 12 months without a period in particular is something clinicians want to know about promptly.";

const PATTERN_COPY: Record<string, { heading: string; body: string }> = {
  [PATTERN.POSTMENOPAUSAL]: {
    heading: "A postmenopausal pattern",
    body:
      "You've described going 12 consecutive months or more without a period. In the STRAW+10 staging " +
      "framework, that's the marker used to define your final menstrual period — identified only in hindsight, " +
      "once the 12 months have passed. Everything from here forward is described as postmenopause. This is " +
      "simply what the timeframe you've described means; it isn't a diagnosis and doesn't require a test to " +
      "confirm.",
  },
  [PATTERN.LATE_TRANSITION]: {
    heading: "A late-transition pattern",
    body:
      "You've described going 60 days or more without a period at some point in the last year. STRAW+10 uses an " +
      "interval like that — 60 days or more between periods — as one of the markers of the late menopause " +
      "transition, a stage that's often, though not always, closer to the final period than the early " +
      "transition is.",
  },
  [PATTERN.EARLY_TRANSITION]: {
    heading: "An early-transition pattern",
    body:
      "You've described your cycle length shifting by a week or more compared with your usual pattern, more " +
      "than once recently. Persistent variability like that — a repeated shift, not just a single one — is one " +
      "of the markers STRAW+10 uses to describe the early menopause transition, a stage that can last for a few " +
      "years before more pronounced changes appear.",
  },
  [PATTERN.POSSIBLE_EARLY_CHANGE]: {
    heading: "A possible early change",
    body:
      "You've described one recent instance of your cycle length shifting by a week or more. On its own, a " +
      "single shift doesn't meet STRAW+10's bar for the early-transition marker, which looks for a repeated " +
      "pattern rather than one occurrence — so this is better described as a possible early change worth " +
      "keeping an eye on than a clear transition marker.",
  },
  [PATTERN.NO_CYCLE_MARKER]: {
    heading: "No cycle marker detected",
    body:
      "Based on what you've described, your cycle doesn't currently show the specific patterns STRAW+10 uses to " +
      "stage the menopause transition — no repeated cycle-length shifts of a week or more, no 60-day-or-longer " +
      "gaps, and no 12-month absence of periods.",
  },
};

const NOTE_TEXT: Record<string, string> = {
  "flow-heavier": "a heavier flow than you're used to",
  "flow-lighter": "a lighter flow than you're used to",
  "flow-varies": "a flow that varies a lot",
  "duration-longer": "periods that last longer than they used to",
  "duration-shorter": "periods that last shorter than they used to",
  "duration-varies": "period length that varies a lot",
  "predictability-sometimes": "timing that's only sometimes predictable",
  "predictability-rarely": "timing that's rarely or never predictable",
};

function readResponses(): CycleChangeResponses {
  const responses: CycleChangeResponses = {};
  for (let id = 0; id <= 6; id++) {
    const checked = form.querySelector<HTMLInputElement>(`input[name="item${id}"]:checked`);
    if (checked) (responses as Record<string, string>)[`item${id}`] = checked.value;
  }
  responses.item7 = item7Checkboxes.filter(cb => cb.checked).map(cb => cb.value);
  return responses;
}

function findMissingItems(responses: CycleChangeResponses): string[] {
  const missing: string[] = [];
  if (!responses.item0) missing.push("0");
  if (!isConfounderGateActive(responses)) {
    for (let id = 1; id <= 6; id++) {
      if (!(responses as Record<string, unknown>)[`item${id}`]) missing.push(String(id));
    }
  }
  if (!responses.item7 || responses.item7.length === 0) missing.push("7");
  return missing;
}

function clearMissingHighlights(): void {
  form.querySelectorAll("[data-item-id]").forEach(el => {
    el.classList.remove("border-[#c07060]", "bg-[#faf5f3]");
  });
}

function highlightMissing(missingIds: string[]): void {
  for (const id of missingIds) {
    form.querySelector(`[data-item-id="${id}"]`)?.classList.add("border-[#c07060]", "bg-[#faf5f3]");
  }
}

function updateGateState(): void {
  const gated = form.querySelector<HTMLInputElement>('input[name="item0"]:checked')?.value === GATE_YES;
  classificationSection.classList.toggle("opacity-50", gated);
  gateNote.classList.toggle("hidden", !gated);
}

form.querySelectorAll<HTMLInputElement>('input[name="item0"]').forEach(input => {
  input.addEventListener("change", updateGateState);
});

// "None of these" is exclusive with every real flag, in both directions.
item7Checkboxes.forEach(checkbox => {
  checkbox.addEventListener("change", () => {
    if (!checkbox.checked) return;
    if (checkbox === item7None) {
      item7Checkboxes.forEach(other => {
        if (other !== item7None) other.checked = false;
      });
    } else {
      item7None.checked = false;
    }
  });
});

function joinWithAnd(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function renderPrintSummary(
  responses: CycleChangeResponses,
  gated: boolean,
  flagged: boolean,
  pattern: string | null
): void {
  const completedOn = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const parts: string[] = [
    `<h1>Cycle Change Tracker — Results Summary</h1>`,
    `<p>Completed ${completedOn} &middot; ripplehealth.app/tools/cycle-changes</p>`,
  ];

  if (flagged) {
    parts.push(`<h2>Worth raising with a clinician soon</h2><p>${FLAG_PANEL_TEXT}</p>`);
  }

  if (gated) {
    parts.push(`<h2>Result</h2><p>${GATE_MESSAGE}</p>`);
  } else if (pattern) {
    const copy = PATTERN_COPY[pattern];
    parts.push(`<h2>${copy.heading}</h2><p>${copy.body}</p>`);
    const notes = getDescriptiveNotes(responses);
    if (notes.length > 0) {
      const phrases = notes.map(n => NOTE_TEXT[n]);
      parts.push(
        `<p>You also mentioned ${joinWithAnd(phrases)}. These are common experiences during the transition, though they aren't part of the formal staging markers above.</p>`
      );
    }
    parts.push(`<p>${HONESTY_CAVEAT}</p>`);
  }

  printSummary.innerHTML = parts.join("\n");
}

function renderResults(responses: CycleChangeResponses): void {
  const gated = isConfounderGateActive(responses);
  const flagged = hasPersistentBleedingFlag(responses);
  const pattern = gated ? null : classifyPattern(responses);

  flagPanel.classList.toggle("hidden", !flagged);

  gatedResult.classList.toggle("hidden", !gated);
  patternResult.classList.toggle("hidden", gated);

  if (!gated && pattern) {
    const copy = PATTERN_COPY[pattern];
    patternHeading.textContent = copy.heading;
    patternBody.textContent = copy.body;

    const notes = getDescriptiveNotes(responses);
    if (notes.length > 0) {
      const phrases = notes.map(n => NOTE_TEXT[n]);
      patternNotes.textContent =
        `You also mentioned ${joinWithAnd(phrases)}. These are common experiences during the transition, ` +
        `though they aren't part of the formal staging markers above.`;
      patternNotes.classList.remove("hidden");
    } else {
      patternNotes.textContent = "";
      patternNotes.classList.add("hidden");
    }
  }

  renderPrintSummary(responses, gated, flagged, pattern);
  resultsSection.classList.remove("hidden");
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const responses = readResponses();
  const missing = findMissingItems(responses);
  clearMissingHighlights();

  if (missing.length > 0) {
    missingWarning.textContent = `Please answer everything above — ${missing.length} item${missing.length === 1 ? "" : "s"} still needed.`;
    missingWarning.classList.remove("hidden");
    highlightMissing(missing);
    form.querySelector(`[data-item-id="${missing[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  missingWarning.classList.add("hidden");
  renderResults(responses);
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

printBtn.addEventListener("click", () => window.print());
editBtn.addEventListener("click", () => form.scrollIntoView({ behavior: "smooth", block: "start" }));

updateGateState();
