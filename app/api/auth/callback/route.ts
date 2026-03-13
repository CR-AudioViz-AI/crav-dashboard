// app/api/auth/callback/route.ts
// javari-dashboard — Supabase Auth PKCE callback
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code        = searchParams.get('code')
  const next        = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] Exchange failed:', error.message)
  }

  return NextResponse.redirect(`${origin}/auth/error?message=auth_callback_failed`)
}
