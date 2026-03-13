// lib/supabase.ts
// javari-dashboard — Supabase client re-exports for compatibility
// Friday, March 13, 2026

export { createClient as createSupabaseBrowserClient } from './supabase/client'
export { createClient as createSupabaseServerClient, createServiceClient } from './supabase/server'
export { supabase } from './supabase/client'
