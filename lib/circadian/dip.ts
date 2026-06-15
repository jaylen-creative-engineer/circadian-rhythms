import { addMinutes } from "date-fns";
import type { CircadianModifiers } from "./modifiers";

export interface DipWindow {
  start: Date;
  end: Date;
  depth: "mild" | "moderate" | "deep";
}

export function computeDip(
  wakeTime: Date,
  sleepPerformance: number,
  modifiers: CircadianModifiers
): DipWindow {
  const baseOffsetMin = 6.5 * 60;
  const dipStart = addMinutes(wakeTime, baseOffsetMin);
  let dipDurationMin = 75;

  dipDurationMin += modifiers.dipExtendMin;
  dipDurationMin -= modifiers.dipCompressMin;

  const perfScore = Math.max(0, Math.min(100, sleepPerformance));
  let depth: DipWindow["depth"];
  if (perfScore >= 80 && !modifiers.peakQualityDowngrade) {
    depth = "mild";
  } else if (perfScore >= 60 && modifiers.dipExtendMin < 10) {
    depth = "moderate";
  } else {
    depth = "deep";
    dipDurationMin += 15;
  }

  if (modifiers.peakQualityDowngrade && depth === "mild") {
    depth = "moderate";
  }

  return {
    start: dipStart,
    end: addMinutes(dipStart, dipDurationMin),
    depth,
  };
}
