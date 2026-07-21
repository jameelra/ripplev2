import "@/index.css";

// Progressive enhancement only: the comparison table is static markup,
// readable and complete with JS off. This script just wires the print
// button to the browser's native print dialog — the same result a reader
// gets from Ctrl/Cmd+P without any JS at all.

const printBtn = document.querySelector<HTMLButtonElement>("#comparison-print-btn");
printBtn?.addEventListener("click", () => window.print());
