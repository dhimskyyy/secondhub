// src/lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a singleton Supabase browser client.
 * Safe for use in Client Components and hooks.
 * Uses cookie-based auth managed by @supabase/ssr.
 */
export function createBrowserSupabaseClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key in environment variables.');
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
