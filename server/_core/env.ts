export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  // Supabase user id of the account that should get the "admin" role.
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Stripe keys/prices are placeholders during beta — keep this off until
  // real ones are configured. Explicit opt-in: anything but "true" is off.
  paymentsEnabled: process.env.PAYMENTS_ENABLED === "true",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Server-side only — never exposed to the client. Powers the Greene widget
  // email capture proxy (server/_core/mailerliteProxy.ts). No VITE_ prefix,
  // so no Dockerfile ARG/ENV is needed for it.
  mailerliteApiKey: process.env.MAILERLITE_API_KEY ?? "",
};

if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
  console.error(
    "[Auth] ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must both be set. Login will not work until they are configured."
  );
}
