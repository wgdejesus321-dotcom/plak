import { afterEach, describe, expect, it } from "vitest";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

describe("server environment helpers", () => {
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalUrl = process.env.SUPABASE_URL;
  const originalViteUrl = process.env.VITE_SUPABASE_URL;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalViteUrl === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = originalViteUrl;
  });

  it("does not require a secret merely to import the module", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getSupabaseServiceRoleKey()).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("prefers Supabase's current server secret key", () => {
    process.env.SUPABASE_SECRET_KEY = "server-only-secret-test-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-key-that-is-not-used";
    expect(getSupabaseServiceRoleKey()).toBe("server-only-secret-test-key");
  });

  it("accepts the legacy service role key for existing projects", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-server-only-test-key";
    expect(getSupabaseServiceRoleKey()).toBe("legacy-server-only-test-key");
  });

  it("accepts the public Supabase URL without requiring a secret", () => {
    delete process.env.SUPABASE_URL;
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
  });
});
