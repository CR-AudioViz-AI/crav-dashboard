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
    // 2026-08-25: this returned 500 for EVERY error including an auth failure, so
    // an unauthenticated caller got "500 Authentication required" - a server fault
    // reported for a client mistake. Four sibling routes in this same repo already
    // map the message correctly; these two were the outliers. A 500 tells a
    // monitor the service is broken and tells the caller nothing actionable.
    const status = msg === 'Authentication required' ? 401
      : msg.includes('Permission') ? 403
      : msg.includes('not found') || msg.includes('No such') ? 404
      : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
