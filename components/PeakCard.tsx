"use client";

import type { CircadianPrediction } from "@/lib/types";
import { formatTime, isActiveWindow } from "@/lib/utils/time";

interface PeakCardProps {
  prediction: CircadianPrediction;
}

export function PeakCard({ prediction }: PeakCardProps) {
  const activePeak = prediction.peaks.find((p) => isActiveWindow(p.start, p.end));

  if (!activePeak) {
    const nextPeak = prediction.peaks.find(
      (p) => new Date(p.start) > new Date()
    );
    if (!nextPeak) return null;

    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Next Peak</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#C8F135]">
          {formatTime(nextPeak.start)}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          until {formatTime(nextPeak.end)} · {nextPeak.quality}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#C8F135]/40 bg-[#C8F135]/10 p-6">
      <p className="text-xs uppercase tracking-widest text-[#C8F135]/70">Active Peak</p>
      <h2 className="mt-1 text-3xl font-bold text-[#C8F135]">High Energy</h2>
      <p className="mt-2 text-sm text-zinc-300">
        {formatTime(activePeak.start)} – {formatTime(activePeak.end)}
      </p>
      <span className="mt-3 inline-block rounded-full bg-[#C8F135]/20 px-3 py-1 text-xs font-medium text-[#C8F135]">
        {activePeak.quality} quality
      </span>
    </div>
  );
}
