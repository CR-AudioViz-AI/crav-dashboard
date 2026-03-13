// app/api/developer/apps/publish/route.ts
// javari-dashboard — publish app to marketplace (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission('apps:publish')
    const body = await req.json()
    const { appId, name, description, version, manifest } = body

    if (!appId || !name || !version) {
      return NextResponse.json({ error: 'appId, name, and version are required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: app, error } = await supabase
      .from('apps')
      .upsert({
        app_id:       appId,
        name,
        description,
        developer_id: userId,
        published:    true,
        version,
        manifest:     manifest ?? {},
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'app_id' })
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    await createAuditLog({ userId, action: 'app.publish', target: 'app', targetId: app?.id, meta: { appId, version } })

    return NextResponse.json({ success: true, appId, id: app?.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    const status = msg === 'Authentication required' ? 401 : msg.includes('Permission') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
