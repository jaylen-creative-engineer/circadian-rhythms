/**
 * Supabase env resolution for legacy and new API key names.
 * @see https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
 */

function readKey(
  singularNames: string[],
  pluralNames: string[],
  keyName = "default"
): string | undefined {
  for (const name of pluralNames) {
    const raw = process.env[name];
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed[keyName]) return parsed[keyName];
    } catch {
      // Not JSON — treat as plain key value.
      return raw;
    }
  }

  for (const name of singularNames) {
    const value = process.env[name];
    if (value) return value;
  }

  return undefined;
}

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
}

export function getSupabasePublishableKey(): string | undefined {
  return readKey(
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_ANON_KEY",
    ],
    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_PUBLISHABLE_KEYS"]
  );
}

/** Server-only key that bypasses RLS for sync/webhook writes. Never expose to the browser. */
export function getSupabaseSecretKey(): string | undefined {
  return readKey(
    [
      "SUPABASE_SECRET_KEY",
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    ["SUPABASE_SECRET_KEYS"]
  );
}

export function requireSupabaseUrl(): string {
  const url = getSupabaseUrl();
  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL in your environment."
    );
  }
  return url;
}

export function requireSupabaseSecretKey(): string {
  const key = getSupabaseSecretKey();
  if (!key) {
    throw new Error(
      "Missing Supabase secret key. Add SUPABASE_SECRET_KEY from Project Settings → API in the Supabase dashboard (server-only, never NEXT_PUBLIC)."
    );
  }
  return key;
}

export function requireSupabasePublishableKey(): string {
  const key = getSupabasePublishableKey();
  if (!key) {
    throw new Error(
      "Missing Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment."
    );
  }
  return key;
}
