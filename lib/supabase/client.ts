// lib/supabase/client.ts — the browser Supabase client
//
// 2026-08-18: replaced createBrowserClient from @supabase/ssr, forbidden by the
// auth architecture locked 2026-07-15. That client keeps the session in cookies;
// a Discord session with provider tokens exceeds 4KB, gets chunked across three
// cookies, and racing client instances clobber the pieces, so the session dies.
// It is exactly what broke javari-spirits, whose shelf could never hold a
// signed-in user.
//
// Module-level singleton, raw supabase-js, localStorage, PKCE. Stable across
// renders by construction, so it is safe as a hook dependency - returning a new
// client per call is what made onAuthStateChange re-subscribe on every render.
//
// CR AudioViz AI · EIN 39-3646201 · August 2026
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient
  const url = supabaseUrl()
  const key = publishableKey()
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  browserClient = createSupabaseClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  })
  return browserClient
}

/** Historical alias. Same singleton - NOT the @supabase/ssr cookie client. */
export const createBrowserClient = createClient
export default createClient
