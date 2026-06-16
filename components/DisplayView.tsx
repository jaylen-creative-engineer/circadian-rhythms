"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useNow } from "@/lib/hooks/use-now";
import type { CircadianPrediction, DisplayMode } from "@/lib/types";
import { formatRemainingDuration, formatTime, isActiveWindow } from "@/lib/utils/time";
import { EnergyTimeline } from "./EnergyTimeline";

const REFRESH_MS = 15 * 60 * 1000;

function DisplayContent({
  mode,
  now,
  prediction,
}: {
  mode: DisplayMode;
  now: Date;
  prediction: CircadianPrediction;
}) {
  switch (mode) {
    case "peak": {
      const peak = prediction.peaks.find((p) => isActiveWindow(p.start, p.end, now));
      const target =
        peak ?? prediction.peaks.find((p) => new Date(p.start) > now) ?? prediction.peaks[0];
      return (
        <div className="text-center">
          <p className="text-[#C8F135]/60 text-sm uppercase tracking-widest">
            {peak ? "Active Peak" : "Next Peak"}
          </p>
          <p className="mt-4 text-6xl font-bold text-[#C8F135]">
            {peak ? formatRemainingDuration(peak.end, now) : formatTime(target.start)}
          </p>
          <p className="mt-2 text-zinc-500">
            {formatTime(target.start)} → {formatTime(target.end)}
          </p>
        </div>
      );
    }
    case "groggy": {
      const active = isActiveWindow(prediction.groggy.start, prediction.groggy.end, now);
      return (
        <div className="text-center opacity-60">
          <p className="text-sm uppercase tracking-widest text-zinc-500">
            {active ? "Active Groggy Window" : "Groggy"}
          </p>
          <p className="mt-4 text-5xl font-bold text-zinc-400">
            {active
              ? formatRemainingDuration(prediction.groggy.end, now)
              : formatTime(prediction.groggy.start)}
          </p>
          <p className="mt-2 text-zinc-600">
            {formatTime(prediction.groggy.start)} → {formatTime(prediction.groggy.end)}
          </p>
        </div>
      );
    }
    case "dip": {
      const active = isActiveWindow(prediction.dip.start, prediction.dip.end, now);
      return (
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-indigo-400">
            {active ? "Active Dip" : "Dip"}
          </p>
          <p
            className={`mt-4 text-5xl font-bold text-indigo-400 ${
              active ? "" : "capitalize"
            }`}
          >
            {active
              ? formatRemainingDuration(prediction.dip.end, now)
              : prediction.dip.depth}
          </p>
          <p className="mt-2 text-zinc-500">
            {formatTime(prediction.dip.start)} – {formatTime(prediction.dip.end)}
          </p>
        </div>
      );
    }
    case "melatonin": {
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
      return (
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-purple-400">
            {melatoninActive ? "Melatonin Window" : "Wind Down"}
          </p>
          <p className="mt-4 text-5xl font-bold text-purple-300">
            {windDownActive || melatoninActive
              ? formatRemainingDuration(activeWindowEnd, now)
              : formatTime(prediction.wind_down_start)}
          </p>
          <p className="mt-2 text-zinc-500">
            Sleep target {formatTime(prediction.sleep_target)}
          </p>
        </div>
      );
    }
    case "compact":
      return (
        <div className="w-full max-w-md px-4">
          <EnergyTimeline prediction={prediction} compact />
        </div>
      );
    case "timeline":
    default:
      return (
        <div className="w-full max-w-lg px-6">
          <EnergyTimeline prediction={prediction} />
        </div>
      );
  }
}

export function DisplayView() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "timeline") as DisplayMode;
  const [prediction, setPrediction] = useState<CircadianPrediction | null>(null);
  const now = useNow();

  useEffect(() => {
    let active = true;

    async function load() {
      const res = await fetch("/api/predictions/today");
      const data = await res.json();
      if (active && res.ok) setPrediction(data.prediction);
    }

    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!prediction) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-600">
        …
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-zinc-100">
      <DisplayContent mode={mode} now={now} prediction={prediction} />
    </div>
  );
}
