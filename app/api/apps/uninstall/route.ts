// app/api/apps/uninstall/route.ts
// javari-dashboard — uninstall app (Supabase)
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

    const { error } = await supabase
      .from('app_installs')
      .delete()
      .eq('user_id', userId)
      .eq('app_id', appId)

    if (error) throw new Error(error.message)

    await createAuditLog({ userId, action: 'app.uninstall', target: 'app', targetId: appId })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
