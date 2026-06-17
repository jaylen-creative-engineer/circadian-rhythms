import { formatISO } from "date-fns";
import { computeHrvAdjustment } from "./adjustments";
import { computeGroggy } from "./groggy";
import { computePeaks } from "./peaks";
import { computeDip } from "./dip";
import { computeMelatonin } from "./melatonin";
import {
  computeRecoveryModifiers,
  computeSleepDebtModifiers,
  hrvToModifiers,
  mergeModifiers,
  millisToHours,
} from "./modifiers";
import type { CircadianPrediction, CycleInput } from "../types";

const HOURS_24 = 24 * 60 * 60 * 1000;

function computeConfidence(
  lastSyncAt?: Date | null,
  recoveryScore?: number | null,
  sleepDebtHours?: number | null
): CircadianPrediction["confidence"] {
  let level: CircadianPrediction["confidence"] = "high";

  if (lastSyncAt) {
    const age = Date.now() - lastSyncAt.getTime();
    if (age > HOURS_24) level = "low";
    else if (age > 12 * 60 * 60 * 1000) level = "medium";
  } else {
    level = "low";
  }

  if (recoveryScore != null && recoveryScore < 34) {
    level = level === "high" ? "medium" : "low";
  }

  if (sleepDebtHours != null && sleepDebtHours >= 1.5) {
    level = level === "high" ? "medium" : "low";
  }

  return level;
}

export function computeCircadianPrediction(input: CycleInput): CircadianPrediction {
  const {
    wakeTime,
    sleepStart,
    sleepEnd,
    deepPct,
    sleepPerformance,
    hrvLastNight,
    hrvBaseline,
    recoveryScore,
    sleepDebtMillis,
    sleepNeedBaselineMillis,
    date,
    calibration,
    lastSyncAt,
  } = input;

  const hrvAdj = computeHrvAdjustment(hrvLastNight, hrvBaseline);

  const modifierParts = [hrvToModifiers(hrvAdj)];

  if (recoveryScore != null) {
    modifierParts.push(computeRecoveryModifiers(recoveryScore));
  }

  if (sleepDebtMillis != null && sleepDebtMillis > 0) {
    modifierParts.push(
      computeSleepDebtModifiers(sleepDebtMillis, sleepNeedBaselineMillis)
    );
  }

  const modifiers = mergeModifiers(...modifierParts);
  const sleepDebtHours = millisToHours(sleepDebtMillis ?? null);

  const groggy = computeGroggy(wakeTime, deepPct, sleepPerformance, modifiers);
  const peaks = computePeaks(
    wakeTime,
    groggy,
    modifiers,
    calibration?.peak_offset_min ?? 0,
    hrvAdj.ratio
  );
  const dip = computeDip(wakeTime, sleepPerformance, modifiers);
  const melatonin = computeMelatonin(
    wakeTime,
    sleepStart,
    calibration?.melatonin_sensitivity_min ?? 0,
    modifiers
  );

  return {
    date,
    wake_time: formatISO(wakeTime),
    groggy: {
      start: formatISO(groggy.start),
      end: formatISO(groggy.end),
      duration_min: groggy.durationMin,
    },
    peaks: peaks.map((p) => ({
      start: formatISO(p.start),
      end: formatISO(p.end),
      quality: p.quality,
    })),
    dip: {
      start: formatISO(dip.start),
      end: formatISO(dip.end),
      depth: dip.depth,
    },
    melatonin_onset: formatISO(melatonin.melatoninOnset),
    wind_down_start: formatISO(melatonin.windDownStart),
    sleep_target: formatISO(melatonin.sleepTarget),
    hrv_adjustment: hrvAdj.ratio,
    recovery_score: recoveryScore ?? null,
    sleep_debt_hours: sleepDebtHours,
    confidence: computeConfidence(lastSyncAt, recoveryScore, sleepDebtHours),
  };
}

export async function computeHrvBaseline(
  records: Array<{ hrv_rmssd: number | null }>
): Promise<number> {
  const values = records
    .map((r) => r.hrv_rmssd)
    .filter((v): v is number => v != null && v > 0);

  if (values.length === 0) return 50;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
