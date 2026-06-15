import { subDays } from "date-fns";
import { createServiceClient } from "../supabase/server";
import { WhoopClient, refreshWhoopToken } from "./client";
import { mergeRecoveryBySleepId, transformSleepRecord } from "./transform";

export interface SyncResult {
  synced: number;
  userId: string;
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createServiceClient();

  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "whoop")
    .single();

  if (error || !integration) {
    throw new Error("WHOOP integration not found");
  }

  const expiresAt = new Date(integration.expires_at);
  if (expiresAt.getTime() > Date.now() + 60_000) {
    return integration.access_token;
  }

  const tokens = await refreshWhoopToken(integration.refresh_token);
  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

  await supabase
    .from("user_integrations")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: newExpiry.toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "whoop");

  return tokens.access_token;
}

export async function syncWhoopForUser(userId: string): Promise<SyncResult> {
  const accessToken = await getValidAccessToken(userId);
  const client = new WhoopClient(accessToken);
  const supabase = createServiceClient();

  const start = subDays(new Date(), 30).toISOString();
  const end = new Date().toISOString();

  const [sleeps, recoveries] = await Promise.all([
    client.getSleepCollection(start, end),
    client.getRecoveryCollection(start, end),
  ]);

  const recoveryMap = mergeRecoveryBySleepId(recoveries);
  const mainSleeps = sleeps.filter((s) => !s.nap && s.score_state === "SCORED");

  let synced = 0;
  for (const sleep of mainSleeps) {
    const recovery = recoveryMap.get(sleep.id);
    const record = transformSleepRecord(sleep, recovery, userId);

    const { error } = await supabase.from("sleep_records").upsert(
      {
        ...record,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "whoop_id" }
    );

    if (!error) synced++;
  }

  return { synced, userId };
}

export async function syncAllWhoopUsers(): Promise<SyncResult[]> {
  const supabase = createServiceClient();
  const { data: integrations } = await supabase
    .from("user_integrations")
    .select("user_id")
    .eq("provider", "whoop");

  if (!integrations?.length) return [];

  const results: SyncResult[] = [];
  for (const { user_id } of integrations) {
    try {
      results.push(await syncWhoopForUser(user_id));
    } catch (err) {
      console.error(`Sync failed for user ${user_id}:`, err);
    }
  }
  return results;
}
