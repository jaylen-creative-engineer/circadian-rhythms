"use client";

import { useNow } from "@/lib/hooks/use-now";
import type { CircadianPrediction } from "@/lib/types";
import {
  formatDuration,
  formatRemainingDuration,
  formatTime,
  isActiveWindow,
} from "@/lib/utils/time";

interface GroggyCoverProps {
  prediction: CircadianPrediction;
}

export function GroggyCover({ prediction }: GroggyCoverProps) {
  const now = useNow();
  const active = isActiveWindow(prediction.groggy.start, prediction.groggy.end, now);

  if (!active) return null;

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/80 p-6 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-widest text-zinc-500">Sleep Inertia</p>
      <h2 className="mt-1 text-2xl font-semibold text-zinc-400">Groggy Window</h2>
      <p className="mt-2 text-zinc-500">
        {formatTime(prediction.groggy.start)} – {formatTime(prediction.groggy.end)}
        <span className="ml-2 text-zinc-600">
          ({formatDuration(prediction.groggy.duration_min)})
        </span>
      </p>
      <p className="mt-4 text-sm text-zinc-600">
        Cognitive output muted. Peak windows unlock after this clears.
      </p>
      <p className="mt-4 text-lg font-medium text-zinc-300">
        {formatRemainingDuration(prediction.groggy.end, now)}
      </p>
    </div>
  );
}
