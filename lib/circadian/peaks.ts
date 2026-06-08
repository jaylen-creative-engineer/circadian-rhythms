import { addMinutes, max as maxDate } from "date-fns";
import type { HrvAdjustment } from "./adjustments";
import type { GroggyWindow } from "./groggy";

export interface PeakWindow {
  start: Date;
  end: Date;
  quality: "high" | "moderate";
}

const BASE_PEAK1_MIN = 105;
const BASE_PEAK2_MIN = 90;
const MAX_SLEEP_BONUS_MIN = 20;
const MAX_DEEP_BONUS_MIN = 8;

/**
 * Scale peak duration based on sleep performance (0–100).
 * Centred at 70 (typical decent night): positive bonus for better sleep,
 * negative for worse. Returns value clamped to ±MAX_SLEEP_BONUS_MIN.
 */
function sleepDurationBonus(sleepPerformance: number): number {
  const perf = Math.max(0, Math.min(100, sleepPerformance));
  const raw = Math.round((perf - 70) * (MAX_SLEEP_BONUS_MIN / 30));
  return Math.max(-MAX_SLEEP_BONUS_MIN, Math.min(MAX_SLEEP_BONUS_MIN, raw));
}

/**
 * Secondary bonus from deep-sleep percentage (typically 15–25 %).
 * Centred at 18 %; positive when deeper, slight negative when shallow.
 */
function deepSleepBonus(deepPct: number): number {
  const raw = Math.round((deepPct - 18) * 0.5);
  return Math.max(-MAX_DEEP_BONUS_MIN, Math.min(MAX_DEEP_BONUS_MIN, raw));
}

export function computePeaks(
  wakeTime: Date,
  groggy: GroggyWindow,
  hrvAdj: HrvAdjustment,
  sleepPerformance: number,
  deepPct: number,
  peakOffsetMin = 0
): PeakWindow[] {
  const sleepBonus = sleepDurationBonus(sleepPerformance);
  const deepBonus = deepSleepBonus(deepPct);
  const totalBonus = sleepBonus + deepBonus;

  const peak1Duration = Math.max(60, BASE_PEAK1_MIN + totalBonus);
  const peak2Duration = Math.max(45, BASE_PEAK2_MIN + totalBonus);

  const peak1Candidate = addMinutes(wakeTime, 90);
  const groggyClear = addMinutes(groggy.end, 15);
  const peak1Start = maxDate([peak1Candidate, groggyClear]);
  const peak1End = addMinutes(peak1Start, peak1Duration);

  const peak2Base = addMinutes(wakeTime, 7.5 * 60 + hrvAdj.peakShiftMin + peakOffsetMin);
  const peak2Start = peak2Base;
  const peak2End = addMinutes(peak2Start, peak2Duration);

  const perfClamped = Math.max(0, Math.min(100, sleepPerformance));
  const quality: "high" | "moderate" =
    hrvAdj.ratio >= 0.92 && perfClamped >= 75 ? "high" : "moderate";

  return [
    { start: peak1Start, end: peak1End, quality },
    { start: peak2Start, end: peak2End, quality },
  ];
}
