// app/api/webhooks/reprocess/route.ts
// javari-dashboard — reprocess failed webhooks (admin, Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    await requirePermission('admin:write')
    const { eventId } = await req.json()
    const supabase = createServiceClient()

    const query = supabase.from('webhook_events').select('*').eq('processed', false)
    if (eventId) query.eq('event_id', eventId)
    const { data: events, error } = await query.limit(50)

    if (error) throw new Error(error.message)

    return NextResponse.json({ queued: events?.length ?? 0, events: events?.map(e => ({ id: e.id, type: e.event_type, provider: e.provider })) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    const status = msg === 'Authentication required' ? 401 : msg.includes('Permission') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
