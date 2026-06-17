import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  requireSupabaseSecretKey,
  requireSupabaseUrl,
} from "./env";

let serviceClient: SupabaseClient | undefined;

/** Service-role client for server-side writes (sync, webhooks, predictions). */
export function createServiceClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(requireSupabaseUrl(), requireSupabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

/** Reset cached client (useful in tests). */
export function resetServiceClient(): void {
  serviceClient = undefined;
}
