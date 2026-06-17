const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface WhoopSleepStageSummary {
  total_in_bed_time_milli?: number;
  total_awake_time_milli?: number;
  total_light_sleep_time_milli?: number;
  total_slow_wave_sleep_time_milli?: number;
  total_rem_sleep_time_milli?: number;
  sleep_cycle_count?: number;
  disturbance_count?: number;
}

export interface WhoopSleepNeeded {
  baseline_milli?: number;
  need_from_sleep_debt_milli?: number;
  need_from_recent_strain_milli?: number;
  need_from_recent_nap_milli?: number;
}

export interface WhoopSleepScore {
  stage_summary?: WhoopSleepStageSummary;
  sleep_needed?: WhoopSleepNeeded;
  sleep_performance_percentage?: number;
  sleep_consistency_percentage?: number;
  sleep_efficiency_percentage?: number;
  respiratory_rate?: number;
}

export interface WhoopSleepRecord {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score?: WhoopSleepScore;
}

export interface WhoopRecoveryRecord {
  cycle_id: string;
  sleep_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score?: {
    user_calibrating?: boolean;
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
}

export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token?: string;
}

export class WhoopClient {
  constructor(private accessToken: string) {}

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${WHOOP_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`WHOOP API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  async getSleepCollection(
    start?: string,
    end?: string,
    limit = 25
  ): Promise<WhoopSleepRecord[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    const all: WhoopSleepRecord[] = [];
    let nextToken: string | undefined;

    do {
      if (nextToken) params.set("nextToken", nextToken);
      const page = await this.fetch<WhoopPaginatedResponse<WhoopSleepRecord>>(
        `/activity/sleep?${params.toString()}`
      );
      all.push(...page.records);
      nextToken = page.next_token;
    } while (nextToken);

    return all;
  }

  async getRecoveryCollection(
    start?: string,
    end?: string,
    limit = 25
  ): Promise<WhoopRecoveryRecord[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    const all: WhoopRecoveryRecord[] = [];
    let nextToken: string | undefined;

    do {
      if (nextToken) params.set("nextToken", nextToken);
      const page = await this.fetch<WhoopPaginatedResponse<WhoopRecoveryRecord>>(
        `/recovery?${params.toString()}`
      );
      all.push(...page.records);
      nextToken = page.next_token;
    } while (nextToken);

    return all;
  }

  async getSleepById(sleepId: string): Promise<WhoopSleepRecord> {
    return this.fetch<WhoopSleepRecord>(`/activity/sleep/${sleepId}`);
  }

  async getRecoveryBySleepId(
    sleepId: string,
    start: string,
    end: string
  ): Promise<WhoopRecoveryRecord | undefined> {
    const recoveries = await this.getRecoveryCollection(start, end);
    return recoveries.find((recovery) => recovery.sleep_id === sleepId);
  }
}

export async function getWhoopUserProfile(accessToken: string): Promise<WhoopUserProfile> {
  const res = await fetch(`${WHOOP_API_BASE}/user/profile/basic`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WHOOP profile fetch failed: ${body}`);
  }

  return res.json() as Promise<WhoopUserProfile>;
}

export async function refreshWhoopToken(
  refreshToken: string
): Promise<WhoopTokenResponse> {
  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WHOOP token refresh failed: ${body}`);
  }

  return res.json() as Promise<WhoopTokenResponse>;
}

export async function exchangeWhoopCode(code: string): Promise<WhoopTokenResponse> {
  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/whoop`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WHOOP code exchange failed: ${body}`);
  }

  return res.json() as Promise<WhoopTokenResponse>;
}
