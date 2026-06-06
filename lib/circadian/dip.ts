import { addMinutes } from "date-fns";
import type { HrvAdjustment } from "./adjustments";

export interface DipWindow {
  start: Date;
  end: Date;
  depth: "mild" | "moderate" | "deep";
}

export function computeDip(
  wakeTime: Date,
  sleepPerformance: number,
  hrvAdj: HrvAdjustment
): DipWindow {
  const baseOffsetMin = 6.5 * 60;
  const dipStart = addMinutes(wakeTime, baseOffsetMin);
  let dipDurationMin = 75;

  dipDurationMin += hrvAdj.dipExtendMin;
  dipDurationMin -= hrvAdj.dipCompressMin;

  const perfScore = Math.max(0, Math.min(100, sleepPerformance));
  let depth: DipWindow["depth"];
  if (perfScore >= 80) {
    depth = "mild";
  } else if (perfScore >= 60) {
    depth = "moderate";
  } else {
    depth = "deep";
    dipDurationMin += 15;
  }

  return {
    start: dipStart,
    end: addMinutes(dipStart, dipDurationMin),
    depth,
  };
}
