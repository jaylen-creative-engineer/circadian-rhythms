"use client";

import { parseISO } from "date-fns";
import { useEffect, useState } from "react";
import type { CircadianPrediction } from "@/lib/types";
import { formatTime, isActiveWindow } from "@/lib/utils/time";

interface MelatoninClockProps {
  prediction: CircadianPrediction;
}

export function MelatoninClock({ prediction }: MelatoninClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  const target = parseISO(prediction.sleep_target);
  const minsToSleep = Math.max(
    0,
    Math.round((target.getTime() - now.getTime()) / 60_000)
  );

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
          {minsToSleep > 0 ? `${minsToSleep} min to sleep target` : "Sleep window open"}
        </p>
      )}
    </div>
  );
}
