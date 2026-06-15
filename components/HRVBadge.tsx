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

function recoveryLabel(score: number): { label: string; color: string } {
  if (score < 34) return { label: "Low", color: "#f87171" };
  if (score < 67) return { label: "Moderate", color: "#facc15" };
  return { label: "High", color: "#C8F135" };
}

export function HRVBadge({ prediction }: HRVBadgeProps) {
  const hrv = hrvLabel(prediction.hrv_adjustment);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hrv.color }} />
        <span className="text-zinc-300">HRV {hrv.label}</span>
        <span className="text-zinc-500">({prediction.hrv_adjustment.toFixed(2)}×)</span>
      </div>

      {prediction.recovery_score != null && (
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm">
          {(() => {
            const rec = recoveryLabel(prediction.recovery_score!);
            return (
              <>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: rec.color }} />
                <span className="text-zinc-300">Recovery {rec.label}</span>
                <span className="text-zinc-500">({prediction.recovery_score}%)</span>
              </>
            );
          })()}
        </div>
      )}

      {prediction.sleep_debt_hours != null && prediction.sleep_debt_hours > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          <span className="text-zinc-300">Sleep Debt</span>
          <span className="text-zinc-500">({prediction.sleep_debt_hours}h)</span>
        </div>
      )}

      <span
        className={`rounded-full px-2.5 py-1 text-xs uppercase ${
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
