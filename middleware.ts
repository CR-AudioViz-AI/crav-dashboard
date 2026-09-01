// middleware.ts
// javari-dashboard — Platform security middleware
// Matches craudiovizai pattern
// Friday, March 13, 2026

import { NextResponse, type NextFetchEvent } from 'next/server'
import { track } from "@/lib/analytics/track"
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

const ATTACK_PATTERNS = {
  sqlInjection: [/union.*select/i, /insert.*into/i, /drop.*table/i],
  xss:          [/<script[\s\S]*?>/i, /javascript:/i, /onerror\s*=/i],
  pathTraversal: [/\.\.\/\.\.\//, /\.\.\\.\.\\/, /%2e%2e%2f/i],
}

const BLOCKED_AGENTS = ['sqlmap', 'nikto', 'nmap', 'metasploit']

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  // Static / internal passthrough
  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Attack pattern detection
  const fullUrl = pathname + request.nextUrl.search
  for (const patterns of Object.values(ATTACK_PATTERNS)) {
    for (const p of patterns) {
      if (p.test(fullUrl)) return new NextResponse('Bad Request', { status: 400 })
    }
  }

  const ua = request.headers.get('user-agent')?.toLowerCase() ?? ''
  for (const blocked of BLOCKED_AGENTS) {
    if (ua.includes(blocked)) return new NextResponse('Forbidden', { status: 403 })
  }

  // Session refresh for protected routes
  const response = NextResponse.next({ request: { headers: request.headers } })

  // ── VISITOR TRACKING ────────────────────────────────────────────────────────
  // 2026-08-16: every request logged, human or machine. Fire and forget — a
  // visitor must not wait on analytics and an analytics outage must not take a
  // page down. Bots are counted rather than blocked, because a traffic figure
  // that silently includes AhrefsBot is a lie told to yourself.
  try {
    event.waitUntil(track({
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') ?? '',
      referrer: request.headers.get('referer'),
      ip: (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
      country: request.headers.get('x-vercel-ip-country'),
      appId: request.nextUrl.hostname,
      sessionId: request.cookies.get('zsid')?.value ?? null,
      userId: null,
    }))
  } catch {
    // Never let tracking break a request.
  }

  const supabase = createServerClient(
    supabaseUrl(),
    publishableKey(),
    {
      cookies: {
        // 2026-09-01: annotated. These are the SESSION COOKIE handlers — the code
        // that decides whether a request is authenticated — and every parameter was
        // an implicit any. noImplicitAny rejected them, so middleware has never
        // typechecked.
        get:    (n: string) => request.cookies.get(n)?.value,
        set:    (n: string, v: string, o: Record<string, unknown>) => { response.cookies.set({ name: n, value: v, ...o }) },
        remove: (n: string, o: Record<string, unknown>)    => { response.cookies.set({ name: n, value: '', ...o }) },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
