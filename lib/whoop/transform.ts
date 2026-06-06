import type { WhoopRecoveryRecord, WhoopSleepRecord } from "./client";
import type { SleepRecord } from "../types";

function pct(part: number | undefined, total: number | undefined): number | null {
  if (!part || !total || total === 0) return null;
  return (part / total) * 100;
}

export function transformSleepRecord(
  sleep: WhoopSleepRecord,
  recovery: WhoopRecoveryRecord | undefined,
  userId: string
): SleepRecord {
  const summary = sleep.score?.stage_summary;
  const totalSleep =
    (summary?.total_light_sleep_time_milli ?? 0) +
    (summary?.total_slow_wave_sleep_time_milli ?? 0) +
    (summary?.total_rem_sleep_time_milli ?? 0);

  return {
    whoop_id: sleep.id,
    user_id: userId,
    start_time: sleep.start,
    end_time: sleep.end,
    hrv_rmssd: recovery?.score?.hrv_rmssd_milli ?? null,
    resting_hr: recovery?.score?.resting_heart_rate ?? null,
    sleep_performance: sleep.score?.sleep_performance_percentage ?? null,
    rem_pct: pct(summary?.total_rem_sleep_time_milli, totalSleep),
    deep_pct: pct(summary?.total_slow_wave_sleep_time_milli, totalSleep),
    light_pct: pct(summary?.total_light_sleep_time_milli, totalSleep),
    raw_payload: { sleep, recovery: recovery ?? null },
  };
}

export function mergeRecoveryBySleepId(
  recoveries: WhoopRecoveryRecord[]
): Map<string, WhoopRecoveryRecord> {
  const map = new Map<string, WhoopRecoveryRecord>();
  for (const r of recoveries) {
    if (r.sleep_id) map.set(r.sleep_id, r);
  }
  return map;
}
