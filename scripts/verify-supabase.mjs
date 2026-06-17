#!/usr/bin/env node
/**
 * Verify Supabase env vars and database connectivity.
 * Usage: node scripts/verify-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

function readKey(singularNames, pluralNames, keyName = "default") {
  for (const name of pluralNames) {
    const raw = process.env[name];
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed[keyName]) return parsed[keyName];
    } catch {
      return raw;
    }
  }
  for (const name of singularNames) {
    if (process.env[name]) return process.env[name];
  }
  return undefined;
}

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const publishable = readKey(
  [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_PUBLISHABLE_KEYS"]
);
const secret = readKey(
  ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  ["SUPABASE_SECRET_KEYS"]
);

console.log("Supabase configuration check\n");

if (!url) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}
console.log("✓ NEXT_PUBLIC_SUPABASE_URL is set");

if (!publishable) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
} else {
  console.log("✓ Publishable key is set");
}

if (!secret) {
  console.error(
    "✗ Missing SUPABASE_SECRET_KEY (required for server sync/webhooks)\n" +
      "  Get it from Supabase Dashboard → Project Settings → API → Secret key"
  );
  process.exit(1);
}
console.log("✓ Secret key is set");

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = [
  "app_users",
  "user_integrations",
  "sleep_records",
  "energy_cycles",
  "webhook_events",
];

console.log("\nTable connectivity:");
let missing = 0;

for (const table of tables) {
  const { error } = await supabase.from(table).select("*", { head: true, count: "exact" });
  if (error?.code === "PGRST205" || error?.message?.includes("does not exist")) {
    console.error(`✗ ${table} — not found (run migrations in Supabase SQL editor)`);
    missing++;
  } else if (error) {
    console.error(`✗ ${table} — ${error.message}`);
    missing++;
  } else {
    console.log(`✓ ${table}`);
  }
}

if (missing > 0) {
  console.log("\nApply migrations from supabase/migrations/ in order (001 → 003).");
  process.exit(1);
}

console.log("\nSupabase connection looks good.");
