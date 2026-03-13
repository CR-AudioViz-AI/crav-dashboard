// middleware.ts
// javari-dashboard — Platform security middleware
// Matches craudiovizai pattern
// Friday, March 13, 2026

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ATTACK_PATTERNS = {
  sqlInjection: [/union.*select/i, /insert.*into/i, /drop.*table/i],
  xss:          [/<script[\s\S]*?>/i, /javascript:/i, /onerror\s*=/i],
  pathTraversal: [/\.\.\/\.\.\//, /\.\.\\\.\.\\/, /%2e%2e%2f/i],
}

const BLOCKED_AGENTS = ['sqlmap', 'nikto', 'nmap', 'metasploit']

export async function middleware(request: NextRequest) {
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (n) => request.cookies.get(n)?.value,
        set:    (n, v, o) => { response.cookies.set({ name: n, value: v, ...o }) },
        remove: (n, o)    => { response.cookies.set({ name: n, value: '', ...o }) },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
