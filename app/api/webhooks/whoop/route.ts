import {
  enqueueWhoopWebhookEvent,
  processWhoopWebhookEvent,
} from "@/lib/whoop/webhook-processor";
import {
  parseWhoopWebhookEvent,
  verifyWhoopWebhookSignature,
  WHOOP_SIGNATURE_HEADER,
  WHOOP_SIGNATURE_TIMESTAMP_HEADER,
} from "@/lib/whoop/webhook";

export const runtime = "nodejs";

/**
 * WHOOP webhook endpoint.
 *
 * Handoff requirements (per WHOOP docs):
 * 1. Validate X-WHOOP-Signature + X-WHOOP-Signature-Timestamp before parsing JSON.
 * 2. Return 2XX within ~1s — persist + dedupe, then process asynchronously.
 * 3. Use trace_id for idempotency (duplicate deliveries are possible).
 * 4. Fetch full resource from the v2 API after notification (sleep/recovery handoff).
 *
 * Configure this URL in the WHOOP Developer Dashboard with v2 model version.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get(WHOOP_SIGNATURE_HEADER);
  const timestamp = request.headers.get(WHOOP_SIGNATURE_TIMESTAMP_HEADER);
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!signature || !timestamp) {
    return Response.json({ error: "Missing WHOOP signature headers" }, { status: 401 });
  }

  if (!clientSecret) {
    return Response.json({ error: "WHOOP client secret not configured" }, { status: 500 });
  }

  if (!verifyWhoopWebhookSignature(rawBody, signature, timestamp, clientSecret)) {
    return Response.json({ error: "Invalid WHOOP webhook signature" }, { status: 401 });
  }

  let event;
  try {
    event = parseWhoopWebhookEvent(rawBody);
  } catch {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const isNew = await enqueueWhoopWebhookEvent(event);
  if (!isNew) {
    return new Response(null, { status: 200 });
  }

  // Async handoff: respond immediately, process after WHOOP receives 2XX.
  void processWhoopWebhookEvent(event).catch((err) => {
    console.error(`WHOOP webhook processing failed (${event.trace_id}):`, err);
  });

  return new Response(null, { status: 200 });
}
