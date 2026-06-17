import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { createServiceClient } from "../supabase/server";
import { getWhoopUserProfile } from "./client";

/** NextAuth may supply epoch seconds or milliseconds depending on the provider path. */
export function parseTokenExpiry(expiresAt: number | undefined): Date {
  if (!expiresAt) {
    return new Date(Date.now() + 3600 * 1000);
  }

  const ms = expiresAt > 1_000_000_000_000 ? expiresAt : expiresAt * 1000;
  return new Date(ms);
}

export async function readSessionJwt() {
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";

  return getToken({
    req: {
      headers: {
        cookie: cookieHeader,
      },
    } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });
}

export async function resolveAppUserId(whoopUserId: number): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id")
    .eq("whoop_user_id", whoopUserId)
    .maybeSingle();

  if (appUser?.id) return appUser.id;

  const { data: integration } = await supabase
    .from("user_integrations")
    .select("user_id")
    .eq("provider", "whoop")
    .eq("whoop_user_id", whoopUserId)
    .maybeSingle();

  return integration?.user_id ?? null;
}

export async function ensureAppUser(
  userId: string,
  whoopUserId: number,
  displayName: string
): Promise<string> {
  const supabase = createServiceClient();
  const resolvedId = (await resolveAppUserId(whoopUserId)) ?? userId;

  const { error } = await supabase.from("app_users").upsert(
    {
      id: resolvedId,
      whoop_user_id: whoopUserId,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(`Failed to save app user: ${error.message}`);
  }

  return resolvedId;
}

export async function persistWhoopIntegration(input: {
  userId: string;
  whoopUserId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  displayName?: string;
}): Promise<string> {
  const userId = await ensureAppUser(
    input.userId,
    input.whoopUserId,
    input.displayName ?? "WHOOP User"
  );

  const supabase = createServiceClient();
  const { error } = await supabase.from("user_integrations").upsert(
    {
      user_id: userId,
      provider: "whoop",
      whoop_user_id: input.whoopUserId,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      expires_at: input.expiresAt.toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    throw new Error(`Failed to save WHOOP integration: ${error.message}`);
  }

  return userId;
}

export async function findWhoopIntegration(userId: string) {
  const supabase = createServiceClient();

  const { data: direct } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "whoop")
    .maybeSingle();

  if (direct) return direct;

  const { data: appUser } = await supabase
    .from("app_users")
    .select("whoop_user_id")
    .eq("id", userId)
    .maybeSingle();

  if (!appUser?.whoop_user_id) return null;

  const { data: byWhoopId } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("provider", "whoop")
    .eq("whoop_user_id", appUser.whoop_user_id)
    .maybeSingle();

  return byWhoopId;
}

/** Backfill tokens after OAuth when the DB row is missing. */
export async function ensureWhoopIntegrationForRequest(userId: string): Promise<void> {
  const existing = await findWhoopIntegration(userId);
  if (existing) return;

  const token = await readSessionJwt();
  const accessToken = token?.accessToken as string | undefined;
  const refreshToken = token?.refreshToken as string | undefined;
  const tokenUserId = (token?.userId ?? token?.sub) as string | undefined;

  if (!accessToken || !refreshToken) {
    throw new Error(
      "WHOOP tokens are not saved yet. Click Reconnect WHOOP in Settings to link your account again."
    );
  }

  if (tokenUserId && tokenUserId !== userId) {
    throw new Error(
      "Session user mismatch. Click Reconnect WHOOP in Settings to refresh your connection."
    );
  }

  const profile = await getWhoopUserProfile(accessToken);

  await persistWhoopIntegration({
    userId,
    whoopUserId: profile.user_id,
    accessToken,
    refreshToken,
    expiresAt: parseTokenExpiry(token?.expiresAt as number | undefined),
    displayName:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "WHOOP User",
  });
}
