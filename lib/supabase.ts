// lib/supabase.ts
// javari-dashboard — Supabase client re-exports for compatibility
// Friday, March 13, 2026

export { createClient as createSupabaseBrowserClient } from './supabase/client'
export { createClient as createSupabaseServerClient, createServiceClient } from './supabase/server'
// 2026-09-01: REMOVED. './supabase/client' exports createClient, not a `supabase`
// singleton — Module has no exported member 'supabase'.
//
// Re-exporting a binding that does not exist means every importer of this barrel
// fails to resolve. The correct entry point is createSupabaseBrowserClient, already
// exported two lines above.
