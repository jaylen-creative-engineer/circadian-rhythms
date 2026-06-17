import { NextResponse } from "next/server";
import { processPendingWebhookEvents } from "@/lib/whoop/webhook-processor";

export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Retry pending/failed WHOOP webhook events (cron fallback).
 * WHOOP retries delivery for ~1 hour; this catches anything still stuck after that.
 */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processPendingWebhookEvents();
  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
