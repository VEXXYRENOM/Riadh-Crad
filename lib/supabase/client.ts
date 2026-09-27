/**
 * @file client.ts
 * @description Supabase browser client (singleton).
 *              Use in Client Components and hooks.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types';

let _client: ReturnType<typeof createBrowserClient<any>> | null = null;

export function createSupabaseBrowserClient() {
  if (_client) return _client;

  _client = createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return _client;
}

/** Convenience alias — use this in all client components. */
export const supabaseBrowser = createSupabaseBrowserClient;
