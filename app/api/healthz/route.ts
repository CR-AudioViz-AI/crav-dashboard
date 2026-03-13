// app/api/healthz/route.ts
// javari-dashboard — health check
// Friday, March 13, 2026

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  let dbStatus = 'ok'

  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('user_credits').select('id').limit(1)
    if (error) dbStatus = 'error'
  } catch {
    dbStatus = 'error'
  }

  return NextResponse.json({
    ok:       dbStatus === 'ok',
    ts:       new Date().toISOString(),
    env:      process.env.NODE_ENV,
    latency:  Date.now() - start,
    checks: { database: { status: dbStatus } },
  })
}
