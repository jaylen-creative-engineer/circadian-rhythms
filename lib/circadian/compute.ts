import { formatISO } from "date-fns";
import { computeHrvAdjustment } from "./adjustments";
import { computeGroggy } from "./groggy";
import { computePeaks } from "./peaks";
import { computeDip } from "./dip";
import { computeMelatonin } from "./melatonin";
import type { CircadianPrediction, CycleInput } from "../types";

const HOURS_24 = 24 * 60 * 60 * 1000;

function computeConfidence(lastSyncAt?: Date | null): CircadianPrediction["confidence"] {
  if (!lastSyncAt) return "low";
  const age = Date.now() - lastSyncAt.getTime();
  if (age > HOURS_24) return "low";
  if (age > 12 * 60 * 60 * 1000) return "medium";
  return "high";
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
    date,
    calibration,
    lastSyncAt,
  } = input;

  const hrvAdj = computeHrvAdjustment(hrvLastNight, hrvBaseline);
  const groggy = computeGroggy(wakeTime, deepPct, sleepPerformance, hrvAdj);
  const peaks = computePeaks(
    wakeTime,
    groggy,
    hrvAdj,
    sleepPerformance,
    deepPct,
    calibration?.peak_offset_min ?? 0
  );
  const dip = computeDip(wakeTime, sleepPerformance, hrvAdj);
  const melatonin = computeMelatonin(
    sleepStart,
    sleepEnd,
    calibration?.melatonin_sensitivity_min ?? 0
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
    confidence: computeConfidence(lastSyncAt),
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
