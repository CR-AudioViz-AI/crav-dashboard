// app/api/apps/install/route.ts
// javari-dashboard — install app (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission('apps:install')
    const { appId } = await req.json()

    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: app } = await supabase
      .from('apps')
      .select('id, app_id, name, published')
      .eq('app_id', appId)
      .single()

    if (!app?.published) {
      return NextResponse.json({ error: 'App not found or not published' }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from('app_installs')
      .select('id')
      .eq('user_id', userId)
      .eq('app_id', app.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'App already installed' }, { status: 409 })
    }

    const { data: install, error: installErr } = await supabase
      .from('app_installs')
      .insert({ user_id: userId, app_id: app.id, enabled: true })
      .select('id')
      .single()

    if (installErr) throw new Error(installErr.message)

    await createAuditLog({ userId, action: 'app.install', target: 'app', targetId: app.id, meta: { appId } })

    return NextResponse.json({ installId: install?.id, appId, success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    const status = msg === 'Authentication required' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
