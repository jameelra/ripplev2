import "@/index.css";
import { buildHrtTrackingLog, hasAnySelection, type HrtTrackingLogSelections } from "@shared/hrtTrackingLogBuilder";

// Progressive enhancement only: every symptom checkbox, regimen checkbox, and
// the notes field already exist as static form controls in the HTML and are
// readable with JS off. This script assembles them into a printable tracking
// log. Nothing here ever calls fetch/XHR — selections only ever live in this
// page's JavaScript memory, for the current session, and are never
// transmitted anywhere.

const symptomsGroup = document.querySelector<HTMLElement>("#hrt-symptoms-group")!;
const regimenGroup = document.querySelector<HTMLElement>("#hrt-regimen-group")!;
const notesInput = document.querySelector<HTMLTextAreaElement>("#hrt-notes")!;

const resultBox = document.querySelector<HTMLElement>("#hrt-log-result")!;
const resultText = document.querySelector<HTMLElement>("#hrt-log-text")!;
const printSummary = document.querySelector<HTMLElement>("#hrt-log-print")!;
const printBtn = document.querySelector<HTMLButtonElement>("#hrt-print-btn")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#hrt-copy-btn")!;
const copyConfirm = document.querySelector<HTMLElement>("#hrt-copy-confirm")!;

function readSelections(): HrtTrackingLogSelections {
  const symptoms = Array.from(
    symptomsGroup.querySelectorAll<HTMLInputElement>('input[name="symptom"]:checked')
  ).map(input => input.value);
  const regimenNotes = Array.from(
    regimenGroup.querySelectorAll<HTMLInputElement>('input[name="regimen"]:checked')
  ).map(input => input.value);
  return { symptoms, regimenNotes, notes: notesInput.value };
}

function render(): void {
  const selections = readSelections();

  if (!hasAnySelection(selections)) {
    resultBox.classList.add("hidden");
    return;
  }

  const log = buildHrtTrackingLog(selections);
  resultText.textContent = log;
  printSummary.textContent = log;
  resultBox.classList.remove("hidden");
}

symptomsGroup.addEventListener("change", render);
regimenGroup.addEventListener("change", render);
notesInput.addEventListener("input", render);

printBtn.addEventListener("click", () => window.print());

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildHrtTrackingLog(readSelections()));
    copyConfirm.classList.remove("hidden");
    setTimeout(() => copyConfirm.classList.add("hidden"), 2500);
  } catch {
    // Clipboard permission denied or unavailable — the print button still works.
  }
});
