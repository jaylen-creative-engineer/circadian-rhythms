import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "./env";

/** Browser client using the publishable key (respects RLS). */
export function createBrowserSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!url || !key) {
    throw new Error("Missing Supabase publishable configuration");
  }

  return createBrowserClient(url, key);
}
