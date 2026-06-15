import { addMinutes, subMinutes } from "date-fns";
import type { CircadianModifiers } from "./modifiers";

export interface MelatoninWindow {
  melatoninOnset: Date;
  windDownStart: Date;
  sleepTarget: Date;
}

/** Minutes of wind-down before melatonin onset begins */
const WIND_DOWN_LEAD_MIN = 60;

/** Melatonin rise window ends at sleep target */
const MELATONIN_LEAD_MIN = 75;

/** Project habitual bedtime onto the next evening after wake */
export function projectTonightBedtime(habitualSleepStart: Date, wakeTime: Date): Date {
  const bedtime = new Date(wakeTime);
  bedtime.setHours(
    habitualSleepStart.getHours(),
    habitualSleepStart.getMinutes(),
    habitualSleepStart.getSeconds(),
    habitualSleepStart.getMilliseconds()
  );

  if (bedtime.getTime() <= wakeTime.getTime()) {
    bedtime.setDate(bedtime.getDate() + 1);
  }

  return bedtime;
}

export function computeMelatonin(
  wakeTime: Date,
  lastSleepStart: Date,
  melatoninSensitivityMin = 0,
  modifiers?: Pick<CircadianModifiers, "melatoninAdvanceMin" | "sleepTargetAdvanceMin">
): MelatoninWindow {
  const eveningAdvance =
    melatoninSensitivityMin + (modifiers?.melatoninAdvanceMin ?? 0);
  const bedtimeAdvance =
    eveningAdvance + (modifiers?.sleepTargetAdvanceMin ?? 0);

  const sleepTarget = subMinutes(
    projectTonightBedtime(lastSleepStart, wakeTime),
    bedtimeAdvance
  );
  const melatoninOnset = subMinutes(sleepTarget, MELATONIN_LEAD_MIN);
  const windDownStart = subMinutes(melatoninOnset, WIND_DOWN_LEAD_MIN);

  return { melatoninOnset, windDownStart, sleepTarget };
}

export function addDayOffset(date: Date, dayOffset: number): Date {
  return addMinutes(date, dayOffset * 24 * 60);
}
