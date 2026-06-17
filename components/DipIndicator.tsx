"use client";

import { useNow } from "@/lib/hooks/use-now";
import type { CircadianPrediction } from "@/lib/types";
import {
  formatRemainingDuration,
  formatTime,
  isActiveWindow,
} from "@/lib/utils/time";

const DEPTH_STYLES = {
  mild: { label: "Mild Dip", color: "#6366f1", opacity: 0.5 },
  moderate: { label: "Moderate Dip", color: "#6366f1", opacity: 0.7 },
  deep: { label: "Deep Dip", color: "#4338ca", opacity: 0.9 },
};

interface DipIndicatorProps {
  prediction: CircadianPrediction;
}

export function DipIndicator({ prediction }: DipIndicatorProps) {
  const now = useNow();
  const active = isActiveWindow(prediction.dip.start, prediction.dip.end, now);
  const style = DEPTH_STYLES[prediction.dip.depth];

  return (
    <div
      className={`rounded-xl border p-6 transition-colors ${
        active
          ? "border-indigo-500/50 bg-indigo-950/40"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-zinc-500">Circadian Trough</p>
      <h2
        className="mt-1 text-2xl font-semibold"
        style={{ color: style.color, opacity: style.opacity }}
      >
        {style.label}
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        {formatTime(prediction.dip.start)} – {formatTime(prediction.dip.end)}
      </p>
      {active && (
        <div className="mt-3 space-y-1">
          <p className="text-lg font-medium text-indigo-200">
            {formatRemainingDuration(prediction.dip.end, now)}
          </p>
          <p className="text-sm text-indigo-300/80">
            Post-lunch energy dip active. Schedule low-cognitive tasks.
          </p>
        </div>
      )}
    </div>
  );
}
