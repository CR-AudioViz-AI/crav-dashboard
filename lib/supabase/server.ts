// @auth-reviewed: createClient() here is the cookie client, and its ONLY
// importer is app/api/auth/callback - verified 2026-08-20. That route calls
// exchangeCodeForSession, the operation that WRITES the session, which genuinely
// needs cookie set/remove access. There is no bearer token yet at that point:
// the callback is what creates it.
//
// The other ten importers use createServiceClient(), which carries no session and
// is correct. Do NOT import createClient anywhere else - every other cookie
// client on this platform was READING a session that nothing writes, which is why
// dozens of routes answered 401 to everyone, signed in or not.
// lib/supabase/server.ts
// javari-dashboard — Supabase server client
// Platform standard: matches craudiovizai pattern exactly
// Friday, March 13, 2026

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { secretKey, publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl(),
    publishableKey(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server Component — ignored when middleware refreshes sessions
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Server Component — ignored when middleware refreshes sessions
          }
        },
      },
    }
  )
}

/** Service-role client for admin operations. Never expose to client. */
export function createServiceClient() {
  const cookieStore = cookies()
  return createServerClient(
    supabaseUrl(),
    secretKey(),
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )
}
