import "@/index.css";
import {
  buildDismissalLogSummary,
  buildEntryFromInput,
  formatDateForDisplay,
  validateEntryInput,
  type DismissalLogEntry,
} from "@shared/dismissalLog";

// Progressive enhancement only: the form fields and quick-select phrases
// already exist in the static HTML and are readable with JS off. This
// script adds the ability to add/remove entries, and to view, print, or
// copy the resulting log. Nothing here ever calls fetch/XHR — entries only
// ever live in this page's JavaScript memory, for the current session.

const form = document.querySelector<HTMLFormElement>("#dismissal-form")!;
const dateInput = document.querySelector<HTMLInputElement>("#dismissal-date")!;
const clinicInput = document.querySelector<HTMLInputElement>("#dismissal-clinic")!;
const clinicianInput = document.querySelector<HTMLInputElement>("#dismissal-clinician")!;
const symptomsInput = document.querySelector<HTMLInputElement>("#dismissal-symptoms")!;
const responseInput = document.querySelector<HTMLTextAreaElement>("#dismissal-response")!;
const resolvedInput = document.querySelector<HTMLInputElement>("#dismissal-resolved")!;
const errorBox = document.querySelector<HTMLElement>("#dismissal-error")!;
const quickSelect = document.querySelector<HTMLElement>("#dismissal-quick-select")!;

const logSection = document.querySelector<HTMLElement>("#dismissal-log")!;
const logSummary = document.querySelector<HTMLElement>("#dismissal-log-summary")!;
const logEntries = document.querySelector<HTMLElement>("#dismissal-log-entries")!;
const printSummary = document.querySelector<HTMLElement>("#dismissal-print-summary")!;
const printBtn = document.querySelector<HTMLButtonElement>("#dismissal-print-btn")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#dismissal-copy-btn")!;
const copyConfirm = document.querySelector<HTMLElement>("#dismissal-copy-confirm")!;

const entries: DismissalLogEntry[] = [];

dateInput.valueAsDate = new Date();

quickSelect.addEventListener("click", event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".dismissal-quick-phrase");
  if (!button) return;
  responseInput.value = button.textContent ?? "";
  responseInput.focus();
});

function renderEntries(): void {
  logEntries.innerHTML = "";
  entries.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = `ripple-card p-4 ${entry.wasResolved ? "border-[#c8d8d0]" : "border-[#e8d8d0]"}`;
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${
              entry.wasResolved
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }">${entry.wasResolved ? "Resolved" : "Unresolved"}</span>
            <span class="text-[10px] text-[#9a9490] font-mono">${formatDateForDisplay(entry.date)}</span>
          </div>
          <p class="text-sm font-bold text-[#1a2b22]">${entry.clinicName}</p>
          ${entry.clinicianName ? `<p class="text-xs text-[#6b7a72]">${entry.clinicianName}</p>` : ""}
          ${entry.symptomsReported.length > 0 ? `<p class="text-xs text-[#6b7a72]">Symptoms: ${entry.symptomsReported.join(", ")}</p>` : ""}
          <p class="text-xs text-[#4a4a42] leading-relaxed">"${entry.response}"</p>
        </div>
        <button type="button" data-remove-index="${index}" class="dismissal-remove-btn shrink-0 text-[10px] text-red-500 font-semibold hover:underline">Remove</button>
      </div>
    `;
    logEntries.appendChild(card);
  });

  logEntries.querySelectorAll<HTMLButtonElement>(".dismissal-remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.removeIndex);
      entries.splice(idx, 1);
      refreshLog();
    });
  });
}

function refreshLog(): void {
  if (entries.length === 0) {
    logSection.classList.add("hidden");
    return;
  }

  logSection.classList.remove("hidden");
  logSummary.textContent = `${entries.length} recorded instance${entries.length !== 1 ? "s" : ""} of symptoms being dismissed or minimised.`;
  renderEntries();
  printSummary.textContent = buildDismissalLogSummary(entries);
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const input = {
    date: dateInput.value,
    clinicName: clinicInput.value,
    clinicianName: clinicianInput.value,
    symptomsRaw: symptomsInput.value,
    response: responseInput.value,
    wasResolved: resolvedInput.checked,
  };

  const error = validateEntryInput(input);
  if (error) {
    errorBox.textContent = error;
    errorBox.classList.remove("hidden");
    return;
  }

  errorBox.classList.add("hidden");
  entries.push(buildEntryFromInput(input));
  refreshLog();

  form.reset();
  dateInput.valueAsDate = new Date();
  logSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

printBtn.addEventListener("click", () => window.print());

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildDismissalLogSummary(entries));
    copyConfirm.classList.remove("hidden");
    setTimeout(() => copyConfirm.classList.add("hidden"), 2500);
  } catch {
    // Clipboard permission denied or unavailable — the print button still works.
  }
});
