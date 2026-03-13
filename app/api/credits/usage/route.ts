// app/api/credits/usage/route.ts
// javari-dashboard — credits usage history (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requirePermission('credits:view')
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const supabase = createServiceClient()

    const { data: wallet } = await supabase
      .from('user_credits')
      .select('balance, plan, lifetime_earned')
      .eq('user_id', userId)
      .single()

    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('id, type, action, amount, balance_after, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return NextResponse.json({
      balance:      wallet?.balance ?? 0,
      plan:         wallet?.plan ?? 'free',
      lifetime:     wallet?.lifetime_earned ?? 0,
      transactions: transactions ?? [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    if (msg === 'Authentication required') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
