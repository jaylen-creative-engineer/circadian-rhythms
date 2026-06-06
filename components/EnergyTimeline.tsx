"use client";

import type { CircadianPrediction } from "@/lib/types";
import { formatTime, isActiveWindow, segmentPosition, VOLT } from "@/lib/utils/time";

interface EnergyTimelineProps {
  prediction: CircadianPrediction;
  compact?: boolean;
}

interface WindowSegment {
  label: string;
  start: string;
  end: string;
  color: string;
  muted?: boolean;
}

function buildSegments(p: CircadianPrediction): WindowSegment[] {
  return [
    {
      label: "Groggy",
      start: p.groggy.start,
      end: p.groggy.end,
      color: "#4a4a4a",
      muted: true,
    },
    {
      label: "Peak 1",
      start: p.peaks[0].start,
      end: p.peaks[0].end,
      color: VOLT,
    },
    {
      label: "Dip",
      start: p.dip.start,
      end: p.dip.end,
      color: "#6366f1",
    },
    {
      label: "Peak 2",
      start: p.peaks[1].start,
      end: p.peaks[1].end,
      color: VOLT,
    },
    {
      label: "Wind Down",
      start: p.wind_down_start,
      end: p.melatonin_onset,
      color: "#a855f7",
    },
    {
      label: "Melatonin",
      start: p.melatonin_onset,
      end: p.sleep_target,
      color: "#7c3aed",
    },
  ];
}

export function EnergyTimeline({ prediction, compact }: EnergyTimelineProps) {
  const segments = buildSegments(prediction);
  const dayStart = prediction.wake_time;
  const dayEnd = prediction.sleep_target;

  return (
    <div className={`w-full ${compact ? "space-y-2" : "space-y-4"}`}>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Wake {formatTime(prediction.wake_time)}</span>
        <span>Sleep {formatTime(prediction.sleep_target)}</span>
      </div>

      <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden">
        {segments.map((seg) => {
          const active = isActiveWindow(seg.start, seg.end);
          const pos = segmentPosition(
            seg.start,
            seg.end,
            dayStart,
            dayEnd
          );
          return (
            <div
              key={seg.label}
              className={`absolute top-0 h-full transition-opacity ${
                active ? "ring-1 ring-white/30 z-10" : ""
              }`}
              style={{
                backgroundColor: seg.color,
                left: `${pos.left}%`,
                width: `${pos.width}%`,
                opacity: active ? 1 : seg.muted ? 0.35 : 0.65,
              }}
              title={`${seg.label}: ${formatTime(seg.start)} – ${formatTime(seg.end)}`}
            />
          );
        })}
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {segments.map((seg) => {
            const active = isActiveWindow(seg.start, seg.end);
            return (
              <div
                key={seg.label}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  active
                    ? "border-[#C8F135]/50 bg-[#C8F135]/10"
                    : "border-zinc-800 bg-zinc-900/50"
                } ${seg.muted ? "opacity-70" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium text-zinc-200">{seg.label}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatTime(seg.start)} – {formatTime(seg.end)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
