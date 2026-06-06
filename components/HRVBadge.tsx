"use client";

import type { CircadianPrediction } from "@/lib/types";

interface HRVBadgeProps {
  prediction: CircadianPrediction;
}

function hrvLabel(ratio: number): { label: string; color: string } {
  if (ratio < 0.85) return { label: "Below Baseline", color: "#f87171" };
  if (ratio > 1.1) return { label: "Above Baseline", color: "#C8F135" };
  return { label: "Normal", color: "#a1a1aa" };
}

export function HRVBadge({ prediction }: HRVBadgeProps) {
  const { label, color } = hrvLabel(prediction.hrv_adjustment);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-zinc-300">HRV {label}</span>
      <span className="text-zinc-500">({prediction.hrv_adjustment.toFixed(2)}×)</span>
      <span
        className={`ml-1 rounded px-1.5 py-0.5 text-xs uppercase ${
          prediction.confidence === "high"
            ? "bg-[#C8F135]/20 text-[#C8F135]"
            : prediction.confidence === "medium"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
        }`}
      >
        {prediction.confidence}
      </span>
    </div>
  );
}
