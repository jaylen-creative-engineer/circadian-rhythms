export interface CircadianPrediction {
  date: string;
  wake_time: string;
  groggy: {
    start: string;
    end: string;
    duration_min: number;
  };
  peaks: Array<{
    start: string;
    end: string;
    quality: "high" | "moderate";
  }>;
  dip: {
    start: string;
    end: string;
    depth: "mild" | "moderate" | "deep";
  };
  melatonin_onset: string;
  wind_down_start: string;
  sleep_target: string;
  hrv_adjustment: number;
  confidence: "high" | "medium" | "low";
}

export interface SleepRecord {
  id?: string;
  whoop_id?: string;
  user_id: string;
  start_time: string;
  end_time: string;
  hrv_rmssd: number | null;
  resting_hr: number | null;
  sleep_performance: number | null;
  rem_pct: number | null;
  deep_pct: number | null;
  light_pct: number | null;
  raw_payload?: Record<string, unknown>;
  synced_at?: string;
}

export interface UserIntegration {
  id?: string;
  user_id: string;
  provider: "whoop";
  whoop_user_id?: number | null;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export type WebhookEventStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed"
  | "skipped";

export interface WebhookEvent {
  id?: string;
  trace_id: string;
  event_type: string;
  whoop_user_id: number;
  resource_id: string;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  error_message?: string | null;
  received_at?: string;
  processed_at?: string | null;
}

export interface EnergyCycle {
  id?: string;
  user_id: string;
  date: string;
  prediction: CircadianPrediction;
  created_at?: string;
}

export interface UserCalibration {
  peak_offset_min: number;
  melatonin_sensitivity_min: number;
}

export interface CycleInput {
  wakeTime: Date;
  sleepStart: Date;
  sleepEnd: Date;
  deepPct: number;
  sleepPerformance: number;
  hrvLastNight: number;
  hrvBaseline: number;
  date: string;
  calibration?: UserCalibration;
  lastSyncAt?: Date | null;
}

export type DisplayMode =
  | "timeline"
  | "peak"
  | "groggy"
  | "dip"
  | "melatonin"
  | "compact";
