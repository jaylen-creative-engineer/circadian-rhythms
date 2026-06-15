import { addMinutes } from "date-fns";
import type { CircadianModifiers } from "./modifiers";

const BASE_GROGGY_MIN = 30;
const MIN_GROGGY_MIN = 15;
const MAX_GROGGY_MIN = 75;

export interface GroggyWindow {
  start: Date;
  end: Date;
  durationMin: number;
}

export function computeGroggy(
  wakeTime: Date,
  deepPct: number,
  sleepPerformance: number,
  modifiers: CircadianModifiers
): GroggyWindow {
  let durationMin = BASE_GROGGY_MIN;

  const deepAdjustment = Math.round((deepPct / 100) * 15);
  durationMin += deepAdjustment;

  const perfScore = Math.max(0, Math.min(100, sleepPerformance));
  const recoveryAdjustment = Math.round(((100 - perfScore) / 100) * 15);
  durationMin += recoveryAdjustment;

  durationMin += modifiers.groggyExtendMin;
  durationMin -= modifiers.groggyShortenMin;

  durationMin = Math.max(MIN_GROGGY_MIN, Math.min(MAX_GROGGY_MIN, durationMin));

  return {
    start: wakeTime,
    end: addMinutes(wakeTime, durationMin),
    durationMin,
  };
}
