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
} from "../../../tools/cycle-changes/pattern.js";

// Progressive enhancement only — see client/tools/cycle-changes/main.ts for
// the full rationale. This is the French-Canadian twin: same logic, same
// shared pattern.js, only the copy dictionary below differs. Nothing here
// ever calls fetch/XHR — every calculation stays in the browser, and
// nothing is persisted between visits.
//
// FRENCH COPY BELOW IS A DRAFT — blocked pending native Quebec French
// review before this page ships. See PR description.

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
  "Les changements du cycle ne sont qu'un signal parmi d'autres. Entre 12 % et 25 % des femmes ne constatent " +
  "que peu ou pas de changement dans la longueur du cycle avant leurs dernières règles, donc un cycle stable " +
  "n'exclut pas la transition.";

const GATE_MESSAGE =
  "Les traitements hormonaux modifient directement le profil de saignement, donc le moment du cycle ne peut pas " +
  "vraiment indiquer où vous en êtes dans la transition pendant que vous les utilisez. Les outils basés sur les " +
  "symptômes ci-dessous pourraient être plus utiles, et il vaut la peine d'en parler à votre clinicien.";

const FLAG_PANEL_TEXT =
  "Certains éléments que vous avez décrits méritent d'être signalés à un clinicien assez rapidement — non pas " +
  "parce que c'est nécessairement grave, mais parce que ce sont des signes qu'on vérifie habituellement plutôt " +
  "que d'attendre. Un saignement après 12 mois sans règles, en particulier, est quelque chose que les cliniciens " +
  "veulent savoir rapidement.";

const PATTERN_COPY: Record<string, { heading: string; body: string }> = {
  [PATTERN.POSTMENOPAUSAL]: {
    heading: "Un profil postménopausique",
    body:
      "Vous avez indiqué être passée 12 mois consécutifs ou plus sans règles. Dans le cadre de stadification " +
      "STRAW+10, c'est le repère utilisé pour définir vos dernières règles — reconnu seulement rétrospectivement, " +
      "une fois les 12 mois écoulés. Tout ce qui suit est désigné comme la postménopause. Ceci décrit simplement " +
      "ce que signifie la période que vous avez indiquée; ce n'est pas un diagnostic et cela ne nécessite aucun " +
      "test pour le confirmer.",
  },
  [PATTERN.LATE_TRANSITION]: {
    heading: "Un profil de transition tardive",
    body:
      "Vous avez indiqué avoir eu une période de 60 jours ou plus sans règles au cours de la dernière année. " +
      "STRAW+10 utilise un intervalle comme celui-là — 60 jours ou plus entre les règles — comme l'un des repères " +
      "de la transition ménopausique tardive, un stade souvent, mais pas toujours, plus proche des dernières " +
      "règles que la transition précoce.",
  },
  [PATTERN.EARLY_TRANSITION]: {
    heading: "Un profil de transition précoce",
    body:
      "Vous avez indiqué que la longueur de votre cycle a changé d'une semaine ou plus par rapport à votre " +
      "profil habituel, plus d'une fois récemment. Une variabilité persistante comme celle-là — un changement " +
      "répété, pas seulement ponctuel — est l'un des repères que STRAW+10 utilise pour décrire la transition " +
      "ménopausique précoce, un stade qui peut durer plusieurs années avant que des changements plus marqués " +
      "apparaissent.",
  },
  [PATTERN.POSSIBLE_EARLY_CHANGE]: {
    heading: "Un changement précoce possible",
    body:
      "Vous avez indiqué un seul changement récent de la longueur de votre cycle d'une semaine ou plus. À lui " +
      "seul, un changement ponctuel n'atteint pas le seuil du repère de transition précoce selon STRAW+10, qui " +
      "recherche un profil répété plutôt qu'un seul événement — il est donc plus juste de parler d'un changement " +
      "précoce possible à surveiller que d'un repère de transition clair.",
  },
  [PATTERN.NO_CYCLE_MARKER]: {
    heading: "Aucun repère de cycle détecté",
    body:
      "D'après ce que vous avez décrit, votre cycle ne présente pas actuellement les profils précis que " +
      "STRAW+10 utilise pour situer la transition ménopausique — aucun changement répété de la longueur du " +
      "cycle d'une semaine ou plus, aucun intervalle de 60 jours ou plus, et aucune absence de règles pendant " +
      "12 mois.",
  },
};

const NOTE_TEXT: Record<string, string> = {
  "flow-heavier": "un flux plus abondant qu'à l'habitude",
  "flow-lighter": "un flux plus léger qu'à l'habitude",
  "flow-varies": "un flux qui varie beaucoup",
  "duration-longer": "des règles qui durent plus longtemps qu'avant",
  "duration-shorter": "des règles qui durent moins longtemps qu'avant",
  "duration-varies": "une durée des règles qui varie beaucoup",
  "predictability-sometimes": "un moment parfois seulement prévisible",
  "predictability-rarely": "un moment rarement ou jamais prévisible",
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

// "Aucun de ces éléments" is exclusive with every real flag, in both directions.
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
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function renderPrintSummary(
  responses: CycleChangeResponses,
  gated: boolean,
  flagged: boolean,
  pattern: string | null
): void {
  const completedOn = new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  const parts: string[] = [
    `<h1>Suivi des changements du cycle — Sommaire des résultats</h1>`,
    `<p>Complété le ${completedOn} &middot; ripplehealth.app/fr/outils/changements-du-cycle</p>`,
  ];

  if (flagged) {
    parts.push(`<h2>À signaler à un clinicien rapidement</h2><p>${FLAG_PANEL_TEXT}</p>`);
  }

  if (gated) {
    parts.push(`<h2>Résultat</h2><p>${GATE_MESSAGE}</p>`);
  } else if (pattern) {
    const copy = PATTERN_COPY[pattern];
    parts.push(`<h2>${copy.heading}</h2><p>${copy.body}</p>`);
    const notes = getDescriptiveNotes(responses);
    if (notes.length > 0) {
      const phrases = notes.map(n => NOTE_TEXT[n]);
      parts.push(
        `<p>Vous avez aussi mentionné ${joinWithAnd(phrases)}. Ce sont des expériences courantes pendant la transition, même si elles ne font pas partie des repères de stadification formels ci-dessus.</p>`
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
        `Vous avez aussi mentionné ${joinWithAnd(phrases)}. Ce sont des expériences courantes pendant la ` +
        `transition, même si elles ne font pas partie des repères de stadification formels ci-dessus.`;
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
    missingWarning.textContent =
      `Veuillez répondre à tout ce qui précède — ${missing.length} élément${missing.length === 1 ? "" : "s"} ` +
      `manquant${missing.length === 1 ? "" : "s"}.`;
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
