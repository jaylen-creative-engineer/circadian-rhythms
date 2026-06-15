import { addMinutes, max as maxDate } from "date-fns";
import type { CircadianModifiers } from "./modifiers";
import type { GroggyWindow } from "./groggy";

export interface PeakWindow {
  start: Date;
  end: Date;
  quality: "high" | "moderate";
}

export function computePeaks(
  wakeTime: Date,
  groggy: GroggyWindow,
  modifiers: CircadianModifiers,
  peakOffsetMin = 0,
  hrvRatio = 1
): PeakWindow[] {
  const peak1Candidate = addMinutes(wakeTime, 90);
  const groggyClear = addMinutes(groggy.end, 15);
  const peak1Start = maxDate([peak1Candidate, groggyClear]);
  const peak1End = addMinutes(peak1Start, 105);

  const peak2Base = addMinutes(
    wakeTime,
    7.5 * 60 + modifiers.peakShiftMin + peakOffsetMin
  );
  const peak2Start = peak2Base;
  const peak2End = addMinutes(peak2Start, 90);

  const hrvOptimal = hrvRatio >= 0.95 && hrvRatio <= 1.05;
  const quality: "high" | "moderate" =
    hrvOptimal && !modifiers.peakQualityDowngrade ? "high" : "moderate";

  return [
    { start: peak1Start, end: peak1End, quality },
    { start: peak2Start, end: peak2End, quality },
  ];
}
