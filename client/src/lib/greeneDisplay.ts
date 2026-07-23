import type { RelativeLevel } from "../../../shared/greeneClimactericScale";

export interface GreeneRangeBand {
  label: string;
  color: string;
  bg: string;
}

// Purely descriptive placement within the scale's possible range — Greene
// (1998) publishes no diagnostic cutoff, so this never implies "mild" vs
// "severe" in a clinical sense. Shared by every surface that displays a real
// Greene score (Evidence Engine, Appointment Prep) so the language can't
// drift between them.
export function getGreeneRangeBand(level: RelativeLevel): GreeneRangeBand {
  if (level === "lower") return { label: "Lower third of range", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (level === "middle") return { label: "Middle third of range", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  return { label: "Upper third of range", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
}
