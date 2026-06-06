import { addMinutes, subHours, subMinutes } from "date-fns";

export interface MelatoninWindow {
  melatoninOnset: Date;
  windDownStart: Date;
  sleepTarget: Date;
}

export function computeMelatonin(
  sleepStart: Date,
  sleepEnd: Date,
  melatoninSensitivityMin = 0
): MelatoninWindow {
  const sleepMidpoint = new Date(
    (sleepStart.getTime() + sleepEnd.getTime()) / 2
  );

  const melatoninOnset = subMinutes(
    subHours(sleepMidpoint, 14),
    melatoninSensitivityMin
  );
  const windDownStart = subMinutes(melatoninOnset, 60);
  const sleepTarget = sleepStart;

  return { melatoninOnset, windDownStart, sleepTarget };
}

export function addDayOffset(date: Date, dayOffset: number): Date {
  return addMinutes(date, dayOffset * 24 * 60);
}
