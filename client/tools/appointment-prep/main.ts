import "@/index.css";
import { buildPrepSheet, hasAnySelection, type PrepSheetSelections } from "@shared/appointmentPrepBuilder";

// Progressive enhancement only: every symptom checkbox, concern checkbox, and
// the notes field already exist as static form controls in the HTML and are
// readable with JS off. This script assembles them into a printable prep
// sheet. Nothing here ever calls fetch/XHR — selections only ever live in
// this page's JavaScript memory, for the current session, and are never
// transmitted anywhere.

const symptomsGroup = document.querySelector<HTMLElement>("#prep-symptoms-group")!;
const concernsGroup = document.querySelector<HTMLElement>("#prep-concerns-group")!;
const notesInput = document.querySelector<HTMLTextAreaElement>("#prep-notes")!;

const resultBox = document.querySelector<HTMLElement>("#prep-sheet-result")!;
const resultText = document.querySelector<HTMLElement>("#prep-sheet-text")!;
const printSummary = document.querySelector<HTMLElement>("#prep-sheet-print")!;
const printBtn = document.querySelector<HTMLButtonElement>("#prep-print-btn")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#prep-copy-btn")!;
const copyConfirm = document.querySelector<HTMLElement>("#prep-copy-confirm")!;

function readSelections(): PrepSheetSelections {
  const symptoms = Array.from(
    symptomsGroup.querySelectorAll<HTMLInputElement>('input[name="symptom"]:checked')
  ).map(input => input.value);
  const concerns = Array.from(
    concernsGroup.querySelectorAll<HTMLInputElement>('input[name="concern"]:checked')
  ).map(input => input.value);
  return { symptoms, concerns, notes: notesInput.value };
}

function render(): void {
  const selections = readSelections();

  if (!hasAnySelection(selections)) {
    resultBox.classList.add("hidden");
    return;
  }

  const sheet = buildPrepSheet(selections);
  resultText.textContent = sheet;
  printSummary.textContent = sheet;
  resultBox.classList.remove("hidden");
}

symptomsGroup.addEventListener("change", render);
concernsGroup.addEventListener("change", render);
notesInput.addEventListener("input", render);

printBtn.addEventListener("click", () => window.print());

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildPrepSheet(readSelections()));
    copyConfirm.classList.remove("hidden");
    setTimeout(() => copyConfirm.classList.add("hidden"), 2500);
  } catch {
    // Clipboard permission denied or unavailable — the print button still works.
  }
});
