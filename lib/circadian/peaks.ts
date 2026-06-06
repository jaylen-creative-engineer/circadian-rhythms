import { addMinutes, max as maxDate } from "date-fns";
import type { HrvAdjustment } from "./adjustments";
import type { GroggyWindow } from "./groggy";

export interface PeakWindow {
  start: Date;
  end: Date;
  quality: "high" | "moderate";
}

export function computePeaks(
  wakeTime: Date,
  groggy: GroggyWindow,
  hrvAdj: HrvAdjustment,
  peakOffsetMin = 0
): PeakWindow[] {
  const peak1Candidate = addMinutes(wakeTime, 90);
  const groggyClear = addMinutes(groggy.end, 15);
  const peak1Start = maxDate([peak1Candidate, groggyClear]);
  const peak1End = addMinutes(peak1Start, 105);

  const peak2Base = addMinutes(wakeTime, 7.5 * 60 + hrvAdj.peakShiftMin + peakOffsetMin);
  const peak2Start = peak2Base;
  const peak2End = addMinutes(peak2Start, 90);

  const quality: "high" | "moderate" =
    hrvAdj.ratio >= 0.95 && hrvAdj.ratio <= 1.05 ? "high" : "moderate";

  return [
    { start: peak1Start, end: peak1End, quality },
    { start: peak2Start, end: peak2End, quality },
  ];
}
