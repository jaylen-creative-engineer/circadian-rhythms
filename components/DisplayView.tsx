"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CircadianPrediction, DisplayMode } from "@/lib/types";
import { formatTime, isActiveWindow } from "@/lib/utils/time";
import { EnergyTimeline } from "./EnergyTimeline";

const REFRESH_MS = 5 * 60 * 1000;

function DisplayContent({
  mode,
  prediction,
}: {
  mode: DisplayMode;
  prediction: CircadianPrediction;
}) {
  switch (mode) {
    case "peak": {
      const peak = prediction.peaks.find((p) => isActiveWindow(p.start, p.end));
      const target = peak ?? prediction.peaks[0];
      return (
        <div className="text-center">
          <p className="text-[#C8F135]/60 text-sm uppercase tracking-widest">
            {peak ? "Active Peak" : "Next Peak"}
          </p>
          <p className="mt-4 text-6xl font-bold text-[#C8F135]">
            {formatTime(target.start)}
          </p>
          <p className="mt-2 text-zinc-500">
            → {formatTime(target.end)}
          </p>
        </div>
      );
    }
    case "groggy":
      return (
        <div className="text-center opacity-60">
          <p className="text-sm uppercase tracking-widest text-zinc-500">Groggy</p>
          <p className="mt-4 text-5xl font-bold text-zinc-400">
            {formatTime(prediction.groggy.start)}
          </p>
          <p className="mt-2 text-zinc-600">
            {prediction.groggy.duration_min} min inertia
          </p>
        </div>
      );
    case "dip":
      return (
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-indigo-400">Dip</p>
          <p className="mt-4 text-5xl font-bold text-indigo-400 capitalize">
            {prediction.dip.depth}
          </p>
          <p className="mt-2 text-zinc-500">
            {formatTime(prediction.dip.start)} – {formatTime(prediction.dip.end)}
          </p>
        </div>
      );
    case "melatonin":
      return (
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-purple-400">Wind Down</p>
          <p className="mt-4 text-5xl font-bold text-purple-300">
            {formatTime(prediction.wind_down_start)}
          </p>
          <p className="mt-2 text-zinc-500">
            Sleep {formatTime(prediction.sleep_target)}
          </p>
        </div>
      );
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const res = await fetch("/api/predictions/today");
      const data = await res.json();
      if (!active) return;
      if (res.ok && data.prediction) {
        setPrediction(data.prediction);
        setError(null);
        return;
      }
      setPrediction(null);
      setError(data.error ?? "Unable to load predictions");
    }

    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black px-6 text-center text-zinc-500">
        {error}
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-600">
        …
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-zinc-100">
      <DisplayContent mode={mode} prediction={prediction} />
    </div>
  );
}
