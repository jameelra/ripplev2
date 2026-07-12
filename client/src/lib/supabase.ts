import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// createClient() throws synchronously on an empty/invalid URL or key. Since
// this module is imported before the app renders, that throw would take
// down the entire app — including local-only features that don't need
// Supabase at all. Degrade to "auth unavailable" instead.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;

if (!supabase) {
  console.error(
    "[Auth] VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must both be set. Login is unavailable until they are configured."
  );
}
