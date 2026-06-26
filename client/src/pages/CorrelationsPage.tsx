import React from "react";
import BiologicalCorrelations from "../components/BiologicalCorrelations";
import { AlertCircle } from "lucide-react";

export default function CorrelationsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="ripple-section-title">Biological Correlations</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          See how your biological signals relate to each other over time — the patterns that matter most
        </p>
      </div>

      <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#4a8a72] shrink-0 mt-0.5" />
        <p className="text-xs text-[#3a5a4a] leading-relaxed">
          <strong>How to read this:</strong> When two lines move together (or inversely), that's a correlation. For example, if your HRV drops on the same days your sleep falls below 6 hours, that's a pattern worth showing your doctor.
        </p>
      </div>

      <BiologicalCorrelations compact={false} />
    </div>
  );
}
