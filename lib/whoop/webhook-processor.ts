import { createServiceClient } from "../supabase/server";
import { buildPredictionForDate } from "../predictions/service";
import { WhoopClient } from "./client";
import { resolveAppUserId } from "./integration";
import { getValidAccessToken } from "./sync";
import { transformSleepRecord } from "./transform";
import type { WhoopWebhookEvent } from "./webhook";
import { isCircadianWebhookEvent } from "./webhook";

export interface WebhookProcessResult {
  traceId: string;
  status: "processed" | "skipped" | "failed";
  message?: string;
}


async function markEventStatus(
  traceId: string,
  status: "processing" | "processed" | "failed" | "skipped",
  errorMessage?: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("webhook_events")
    .update({
      status,
      error_message: errorMessage ?? null,
      processed_at: status === "processing" ? null : new Date().toISOString(),
    })
    .eq("trace_id", traceId);
}

async function upsertSleepFromWhoop(
  appUserId: string,
  sleepId: string,
  accessToken: string
): Promise<boolean> {
  const client = new WhoopClient(accessToken);
  const sleep = await client.getSleepById(sleepId);

  if (sleep.nap || sleep.score_state !== "SCORED") {
    return false;
  }

  const recovery = await client.getRecoveryBySleepId(
    sleepId,
    sleep.start,
    sleep.end
  );

  const record = transformSleepRecord(sleep, recovery, appUserId);
  const supabase = createServiceClient();

  const { error } = await supabase.from("sleep_records").upsert(
    {
      ...record,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "whoop_id" }
  );

  if (error) throw new Error(error.message);

  const wakeDate = new Date(sleep.end);
  await buildPredictionForDate(appUserId, wakeDate);

  return true;
}

async function deleteSleepRecord(sleepId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("sleep_records").delete().eq("whoop_id", sleepId);
}

async function refreshRecoveryOnSleep(
  appUserId: string,
  sleepId: string,
  accessToken: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("sleep_records")
    .select("*")
    .eq("whoop_id", sleepId)
    .single();

  const client = new WhoopClient(accessToken);

  if (existing) {
    const sleep = existing.raw_payload?.sleep as { start?: string; end?: string } | undefined;
    const start = sleep?.start ?? existing.start_time;
    const end = sleep?.end ?? existing.end_time;

    const recovery = await client.getRecoveryBySleepId(sleepId, start, end);
    if (!recovery) return false;

    const whoopSleep = await client.getSleepById(sleepId);
    const record = transformSleepRecord(whoopSleep, recovery, appUserId);

    const { error } = await supabase.from("sleep_records").upsert(
      {
        ...record,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "whoop_id" }
    );

    if (error) throw new Error(error.message);

    await buildPredictionForDate(appUserId, new Date(existing.end_time));
    return true;
  }

  return upsertSleepFromWhoop(appUserId, sleepId, accessToken);
}

async function clearRecoveryFromSleep(sleepId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("sleep_records")
    .select("raw_payload")
    .eq("whoop_id", sleepId)
    .single();

  if (!existing) return;

  const payload = (existing.raw_payload ?? {}) as Record<string, unknown>;
  await supabase
    .from("sleep_records")
    .update({
      hrv_rmssd: null,
      resting_hr: null,
      raw_payload: { ...payload, recovery: null },
      synced_at: new Date().toISOString(),
    })
    .eq("whoop_id", sleepId);
}

export async function processWhoopWebhookEvent(
  event: WhoopWebhookEvent
): Promise<WebhookProcessResult> {
  const { trace_id: traceId, type, user_id: whoopUserId, id: resourceId } = event;

  if (!isCircadianWebhookEvent(type)) {
    await markEventStatus(traceId, "skipped", "Event type not used by circadian pipeline");
    return { traceId, status: "skipped", message: "workout events ignored" };
  }

  const appUserId = await resolveAppUserId(whoopUserId);
  if (!appUserId) {
    await markEventStatus(traceId, "skipped", "No linked integration for WHOOP user");
    return { traceId, status: "skipped", message: "unknown WHOOP user" };
  }

  await markEventStatus(traceId, "processing");

  try {
    const accessToken = await getValidAccessToken(appUserId);

    switch (type) {
      case "sleep.updated":
        await upsertSleepFromWhoop(appUserId, resourceId, accessToken);
        break;
      case "sleep.deleted":
        await deleteSleepRecord(resourceId);
        break;
      case "recovery.updated":
        await refreshRecoveryOnSleep(appUserId, resourceId, accessToken);
        break;
      case "recovery.deleted":
        await clearRecoveryFromSleep(resourceId);
        break;
    }

    await markEventStatus(traceId, "processed");
    return { traceId, status: "processed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown webhook processing error";
    await markEventStatus(traceId, "failed", message);
    return { traceId, status: "failed", message };
  }
}

/** Reconcile pending/failed webhook events (cron fallback). */
export async function processPendingWebhookEvents(limit = 25): Promise<WebhookProcessResult[]> {
  const supabase = createServiceClient();
  const { data: events } = await supabase
    .from("webhook_events")
    .select("payload")
    .in("status", ["pending", "failed"])
    .order("received_at", { ascending: true })
    .limit(limit);

  if (!events?.length) return [];

  const results: WebhookProcessResult[] = [];
  for (const row of events) {
    results.push(await processWhoopWebhookEvent(row.payload as WhoopWebhookEvent));
  }
  return results;
}

/**
 * Persist a webhook for idempotency. Returns false when trace_id was already seen.
 */
export async function enqueueWhoopWebhookEvent(
  event: WhoopWebhookEvent
): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("webhook_events").insert({
    trace_id: event.trace_id,
    event_type: event.type,
    whoop_user_id: event.user_id,
    resource_id: String(event.id),
    payload: event,
    status: "pending",
  });

  if (error?.code === "23505") return false;
  if (error) throw new Error(error.message);
  return true;
}
