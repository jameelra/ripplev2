import { supabase } from "./supabase";

/** Attaches the current Supabase session's bearer token, if any, to a tRPC request. */
export async function getTrpcAuthHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
