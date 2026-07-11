import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
      throw new Error(
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY."
      );
    }
    _client = createClient(ENV.supabaseUrl, ENV.supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export type SupabaseIdentity = {
  id: string;
  email: string | null;
  provider: string | null;
};

/**
 * Verifies a Supabase access token against Supabase's Auth API. Delegating
 * verification (rather than checking the JWT signature locally) means this
 * keeps working regardless of which signing-key scheme the project uses.
 */
export async function verifySupabaseToken(
  accessToken: string
): Promise<SupabaseIdentity | null> {
  const client = getClient();
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    provider: (data.user.app_metadata?.provider as string | undefined) ?? null,
  };
}
