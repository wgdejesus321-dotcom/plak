/**
 * Server-only environment access.
 *
 * Do not import this module from client/src or expose these values through Vite.
 * Railway injects secrets at runtime; the build never imports or validates them.
 */
export function getSupabaseServiceRoleKey(): string {
  const value =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) {
    throw new Error(
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required for this protected server operation. " +
        "Set it in Railway service variables and retry the request."
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  if (!value) {
    throw new Error(
      "SUPABASE_URL or VITE_SUPABASE_URL is required for this protected server operation."
    );
  }
  return value;
}
