import { addMinutes } from "date-fns";
import type { HrvAdjustment } from "./adjustments";

export interface DipWindow {
  start: Date;
  end: Date;
  depth: "mild" | "moderate" | "deep";
}

const BASE_DIP_MIN = 75;
const MAX_DIP_SLEEP_ADJUST = 15;
const MIN_DIP_MIN = 40;
const MAX_DIP_MIN = 105;

/**
 * Smooth dip-duration adjustment from sleep performance (0–100).
 * Centred at 70: good sleep compresses the dip, poor sleep extends it.
 * Returns a value in [-MAX_DIP_SLEEP_ADJUST, +MAX_DIP_SLEEP_ADJUST].
 */
function sleepDipAdjust(sleepPerformance: number): number {
  const perf = Math.max(0, Math.min(100, sleepPerformance));
  const raw = Math.round((70 - perf) * (MAX_DIP_SLEEP_ADJUST / 30));
  return Math.max(-MAX_DIP_SLEEP_ADJUST, Math.min(MAX_DIP_SLEEP_ADJUST, raw));
}

export function computeDip(
  wakeTime: Date,
  sleepPerformance: number,
  hrvAdj: HrvAdjustment
): DipWindow {
  const baseOffsetMin = 6.5 * 60;
  const dipStart = addMinutes(wakeTime, baseOffsetMin);
  let dipDurationMin = BASE_DIP_MIN;

  dipDurationMin += hrvAdj.dipExtendMin;
  dipDurationMin -= hrvAdj.dipCompressMin;

  dipDurationMin += sleepDipAdjust(sleepPerformance);

  const perfScore = Math.max(0, Math.min(100, sleepPerformance));
  let depth: DipWindow["depth"];
  if (perfScore >= 80) {
    depth = "mild";
  } else if (perfScore >= 60) {
    depth = "moderate";
  } else {
    depth = "deep";
  }

  dipDurationMin = Math.max(MIN_DIP_MIN, Math.min(MAX_DIP_MIN, dipDurationMin));

  return {
    start: dipStart,
    end: addMinutes(dipStart, dipDurationMin),
    depth,
  };
}
