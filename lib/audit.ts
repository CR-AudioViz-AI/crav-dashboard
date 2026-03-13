// lib/audit.ts
// javari-dashboard — Audit logging via Supabase
// Friday, March 13, 2026

import { createServiceClient } from '@/lib/supabase/server'

interface AuditLogParams {
  userId?: string
  orgId?: string
  action: string
  target: string
  targetId?: string
  meta?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('audit_logs').insert({
      user_id:    params.userId,
      action:     params.action,
      target:     params.target,
      target_id:  params.targetId,
      meta:       params.meta ?? {},
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Audit log failure must never break the main request
    console.error('[audit] Failed to write audit log:', err)
  }
}
