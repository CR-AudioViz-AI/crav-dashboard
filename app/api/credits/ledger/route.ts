// app/api/credits/ledger/route.ts
// javari-dashboard — credit ledger (admin) (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('admin:read')
    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
    const supabase = createServiceClient()

    let query = supabase
      .from('credit_transactions')
      .select('id, user_id, type, action, amount, balance_before, balance_after, description, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (targetUserId) query = query.eq('user_id', targetUserId)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ transactions: data ?? [] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    const status = msg.includes('Authentication') ? 401 : msg.includes('Permission') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
