"use client";

import { useNow } from "@/lib/hooks/use-now";
import type { CircadianPrediction } from "@/lib/types";
import { formatRemainingDuration, formatTime, isActiveWindow } from "@/lib/utils/time";

interface MelatoninClockProps {
  prediction: CircadianPrediction;
}

export function MelatoninClock({ prediction }: MelatoninClockProps) {
  const now = useNow();

  const windDownActive = isActiveWindow(
    prediction.wind_down_start,
    prediction.melatonin_onset,
    now
  );
  const melatoninActive = isActiveWindow(
    prediction.melatonin_onset,
    prediction.sleep_target,
    now
  );

  const activeWindowEnd = windDownActive
    ? prediction.melatonin_onset
    : prediction.sleep_target;
  const activeWindowLabel = windDownActive ? "wind down" : "melatonin window";

  return (
    <div
      className={`rounded-xl border p-6 ${
        windDownActive || melatoninActive
          ? "border-purple-500/40 bg-purple-950/30"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-zinc-500">Evening Cycle</p>
      <h2 className="mt-1 text-2xl font-semibold text-purple-300">
        {melatoninActive ? "Melatonin Window" : windDownActive ? "Wind Down" : "Sleep Target"}
      </h2>

      <div className="mt-3 space-y-1 text-sm text-zinc-400">
        <p>Wind down: {formatTime(prediction.wind_down_start)}</p>
        <p>Melatonin onset: {formatTime(prediction.melatonin_onset)}</p>
        <p>Sleep target: {formatTime(prediction.sleep_target)}</p>
      </div>

      {(windDownActive || melatoninActive) && (
        <p className="mt-4 text-lg font-medium text-purple-200">
          {formatRemainingDuration(activeWindowEnd, now)} in {activeWindowLabel}
        </p>
      )}
    </div>
  );
}
