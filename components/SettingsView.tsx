"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export function SettingsView() {
  const { data: session, status } = useSession();
  const [peakOffset, setPeakOffset] = useState(0);
  const [melatoninSens, setMelatoninSens] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/calibration")
      .then((r) => r.json())
      .then((data) => {
        setPeakOffset(data.peak_offset_min ?? 0);
        setMelatoninSens(data.melatonin_sensitivity_min ?? 0);
      })
      .catch(() => {});
  }, [session]);

  async function saveCalibration() {
    await fetch("/api/calibration", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        peak_offset_min: peakOffset,
        melatonin_sensitivity_min: melatoninSens,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function reconnectWhoop() {
    setSyncResult(null);
    await signOut({ redirect: false });
    await signIn("whoop", { callbackUrl: "/dashboard/settings" });
  }

  async function triggerSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync/whoop", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`Synced ${data.result?.synced ?? 0} sleep records`);
      } else {
        setSyncResult(data.error ?? "Sync failed");
      }
    } catch {
      setSyncResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          WHOOP connection, sync, and personal calibration
        </p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="font-medium text-zinc-200">WHOOP Integration</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sleep and recovery update automatically via WHOOP webhooks after each
          night. Use Sync Now as a manual fallback.
        </p>

        {status === "loading" ? (
          <p className="mt-4 text-sm text-zinc-500">Checking session…</p>
        ) : session ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-[#C8F135]">Connected as {session.user.name}</p>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Sync Now (fallback)"}
            </button>
            <button
              onClick={reconnectWhoop}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Reconnect WHOOP
            </button>
            {syncResult && (
              <p className="text-sm text-zinc-400">
                {syncResult}
                {syncResult.includes("Reconnect WHOOP") && (
                  <span className="ml-2 text-[#C8F135]">Use the button above.</span>
                )}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn("whoop")}
            className="mt-4 rounded-lg bg-[#C8F135] px-4 py-2 text-sm font-medium text-black hover:bg-[#b8e125]"
          >
            Connect WHOOP
          </button>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="font-medium text-zinc-200">Calibration</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Fine-tune predictions. 30-day HRV baseline auto-calibrates from synced data.
        </p>

        <div className="mt-6 space-y-6">
          <label className="block">
            <span className="text-sm text-zinc-400">
              Peak offset ({peakOffset > 0 ? "+" : ""}
              {peakOffset} min)
            </span>
            <input
              type="range"
              min={-60}
              max={60}
              step={5}
              value={peakOffset}
              onChange={(e) => setPeakOffset(Number(e.target.value))}
              className="mt-2 w-full accent-[#C8F135]"
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-400">
              Melatonin sensitivity ({melatoninSens > 0 ? "+" : ""}
              {melatoninSens} min)
            </span>
            <input
              type="range"
              min={-30}
              max={30}
              step={5}
              value={melatoninSens}
              onChange={(e) => setMelatoninSens(Number(e.target.value))}
              className="mt-2 w-full accent-purple-500"
            />
          </label>

          <button
            onClick={saveCalibration}
            disabled={!session}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save Calibration"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="font-medium text-zinc-200">Meta Display Modes</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Chromeless routes for Meta Ray-Ban HUD or Portal casting.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          {[
            ["timeline", "Full day arc"],
            ["peak", "Active peak window"],
            ["groggy", "Sleep inertia"],
            ["dip", "Circadian trough"],
            ["melatonin", "Wind-down countdown"],
            ["compact", "Minimal timeline"],
          ].map(([mode, label]) => (
            <li key={mode}>
              <Link
                href={`/display?mode=${mode}`}
                className="text-[#C8F135] hover:underline"
              >
                /display?mode={mode}
              </Link>
              <span className="ml-2 text-zinc-600">— {label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
