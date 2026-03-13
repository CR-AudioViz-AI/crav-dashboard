// lib/supabase/client.ts
// javari-dashboard — Supabase browser client
// Platform standard: matches craudiovizai pattern exactly
// Friday, March 13, 2026

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton for legacy imports
export const supabase = createClient()
