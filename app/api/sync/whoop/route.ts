import { NextResponse } from "next/server";
import { syncAllWhoopUsers, syncWhoopForUser } from "@/lib/whoop/sync";
import { processPendingWebhookEvents } from "@/lib/whoop/webhook-processor";
import { resolveUserId } from "@/lib/predictions/service";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  const isCron = authorizeCron(request);

  try {
    if (isCron) {
      const [results, webhookResults] = await Promise.all([
        syncAllWhoopUsers(),
        processPendingWebhookEvents(),
      ]);
      return NextResponse.json({ ok: true, results, webhookResults });
    }

    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncWhoopForUser(userId);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
