import { createHmac, timingSafeEqual } from "crypto";

/** WHOOP webhook event types (v2 model). */
export type WhoopWebhookEventType =
  | "sleep.updated"
  | "sleep.deleted"
  | "recovery.updated"
  | "recovery.deleted"
  | "workout.updated"
  | "workout.deleted";

/** Payload POSTed by WHOOP to the configured webhook URL. */
export interface WhoopWebhookEvent {
  user_id: number;
  /** v2: UUID of the resource (sleep UUID for recovery events). */
  id: string;
  type: WhoopWebhookEventType;
  trace_id: string;
}

export const WHOOP_SIGNATURE_HEADER = "X-WHOOP-Signature";
export const WHOOP_SIGNATURE_TIMESTAMP_HEADER = "X-WHOOP-Signature-Timestamp";

/** Reject signatures older than 5 minutes to mitigate replay attacks. */
export const WHOOP_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Verify a WHOOP webhook signature.
 *
 * WHOOP signs: base64(HMAC-SHA256(timestamp + rawBody, client_secret))
 * using the millisecond epoch value from X-WHOOP-Signature-Timestamp.
 */
export function verifyWhoopWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  clientSecret: string
): boolean {
  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs)) return false;

  const ageMs = Math.abs(Date.now() - timestampMs);
  if (ageMs > WHOOP_SIGNATURE_TOLERANCE_MS) return false;

  const expected = createHmac("sha256", clientSecret)
    .update(timestamp + rawBody)
    .digest("base64");

  const received = Buffer.from(signature, "base64");
  const computed = Buffer.from(expected, "base64");

  if (received.length !== computed.length) return false;
  return timingSafeEqual(received, computed);
}

export function parseWhoopWebhookEvent(rawBody: string): WhoopWebhookEvent {
  const parsed = JSON.parse(rawBody) as WhoopWebhookEvent;

  if (
    typeof parsed.user_id !== "number" ||
    typeof parsed.id !== "string" ||
    typeof parsed.type !== "string" ||
    typeof parsed.trace_id !== "string"
  ) {
    throw new Error("Invalid WHOOP webhook payload");
  }

  return parsed;
}

/** Events this app processes for circadian predictions. */
export function isCircadianWebhookEvent(type: WhoopWebhookEventType): boolean {
  return type.startsWith("sleep.") || type.startsWith("recovery.");
}
