"use client";

import { useEffect, useState } from "react";
import type { CircadianPrediction } from "@/lib/types";
import { EnergyTimeline } from "./EnergyTimeline";
import { GroggyCover } from "./GroggyCover";
import { PeakCard } from "./PeakCard";
import { DipIndicator } from "./DipIndicator";
import { MelatoninClock } from "./MelatoninClock";
import { HRVBadge } from "./HRVBadge";

const REFRESH_MS = 15 * 60 * 1000;

export function DashboardView() {
  const [prediction, setPrediction] = useState<CircadianPrediction | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/predictions/today");
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        setPrediction(data.prediction);
        setDemo(data.demo ?? false);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading circadian data…
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center">
        <p className="text-red-400">{error ?? "No prediction available"}</p>
        <a
          href="/dashboard/settings"
          className="mt-4 inline-block text-sm text-[#C8F135] hover:underline"
        >
          Connect WHOOP →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Circadian Intelligence</h1>
          <p className="text-sm text-zinc-500">
            {demo ? "Demo mode — connect WHOOP for live data" : "Live WHOOP-powered predictions"}
          </p>
        </div>
        <HRVBadge prediction={prediction} />
      </div>

      <GroggyCover prediction={prediction} />
      <PeakCard prediction={prediction} />

      <div className="grid gap-4 md:grid-cols-2">
        <DipIndicator prediction={prediction} />
        <MelatoninClock prediction={prediction} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-zinc-500">
          Full Day Arc
        </h2>
        <EnergyTimeline prediction={prediction} />
      </div>
    </div>
  );
}
