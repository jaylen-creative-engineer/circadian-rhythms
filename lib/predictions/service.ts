import { format, subDays } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createServiceClient } from "@/lib/supabase/server";
import {
  computeCircadianPrediction,
  computeHrvBaseline,
} from "@/lib/circadian/compute";
import type { CircadianPrediction, UserCalibration } from "@/lib/types";

export async function resolveUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? process.env.APP_USER_ID ?? process.env.DEMO_USER_ID ?? null;
}

export async function getLatestSleep(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("sleep_records")
    .select("*")
    .eq("user_id", userId)
    .order("end_time", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function getCalibration(userId: string): Promise<UserCalibration> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("user_calibration")
    .select("peak_offset_min, melatonin_sensitivity_min")
    .eq("user_id", userId)
    .single();

  return {
    peak_offset_min: data?.peak_offset_min ?? 0,
    melatonin_sensitivity_min: data?.melatonin_sensitivity_min ?? 0,
  };
}

export async function buildPredictionForDate(
  userId: string,
  targetDate: Date
): Promise<CircadianPrediction | null> {
  const supabase = createServiceClient();
  const dateStr = format(targetDate, "yyyy-MM-dd");

  const { data: cached } = await supabase
    .from("energy_cycles")
    .select("prediction")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .single();

  const sleep = await getLatestSleep(userId);
  if (!sleep) return cached?.prediction as CircadianPrediction | null;

  const { data: history } = await supabase
    .from("sleep_records")
    .select("hrv_rmssd, synced_at")
    .eq("user_id", userId)
    .gte("end_time", subDays(new Date(), 30).toISOString())
    .order("end_time", { ascending: false });

  const hrvBaseline = await computeHrvBaseline(history ?? []);
  const calibration = await getCalibration(userId);

  const wakeTime = new Date(sleep.end_time);
  const sleepStart = new Date(sleep.start_time);
  const sleepEnd = new Date(sleep.end_time);

  const prediction = computeCircadianPrediction({
    wakeTime,
    sleepStart,
    sleepEnd,
    deepPct: sleep.deep_pct ?? 20,
    sleepPerformance: sleep.sleep_performance ?? 70,
    hrvLastNight: sleep.hrv_rmssd ?? hrvBaseline,
    hrvBaseline,
    recoveryScore: sleep.recovery_score,
    sleepDebtMillis: sleep.sleep_debt_millis,
    sleepNeedBaselineMillis: sleep.sleep_need_baseline_millis,
    date: dateStr,
    calibration,
    lastSyncAt: sleep.synced_at ? new Date(sleep.synced_at) : null,
  });

  await supabase.from("energy_cycles").upsert(
    {
      user_id: userId,
      date: dateStr,
      prediction,
    },
    { onConflict: "user_id,date" }
  );

  return prediction;
}

export function demoPrediction(): CircadianPrediction {
  const now = new Date();
  const wake = new Date(now);
  wake.setHours(7, 0, 0, 0);

  return computeCircadianPrediction({
    wakeTime: wake,
    sleepStart: new Date(wake.getTime() - 8 * 60 * 60 * 1000),
    sleepEnd: wake,
    deepPct: 22,
    sleepPerformance: 78,
    hrvLastNight: 55,
    hrvBaseline: 52,
    recoveryScore: 72,
    sleepDebtMillis: 45 * 60 * 1000,
    sleepNeedBaselineMillis: 8 * 60 * 60 * 1000,
    date: format(now, "yyyy-MM-dd"),
    lastSyncAt: now,
  });
}
