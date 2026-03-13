// app/api/billing/manage/route.ts
// javari-dashboard — billing info (Supabase)
// Friday, March 13, 2026

import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { userId } = await requirePermission('billing:view')
    const supabase = createServiceClient()

    const { data: credits } = await supabase
      .from('user_credits')
      .select('balance, plan, subscription_active, next_refresh_at')
      .eq('user_id', userId)
      .single()

    const { data: txns } = await supabase
      .from('credit_transactions')
      .select('id, type, amount, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      subscription: {
        plan:   credits?.plan ?? 'free',
        active: credits?.subscription_active ?? false,
        renews: credits?.next_refresh_at ?? null,
      },
      balance:      credits?.balance ?? 0,
      transactions: txns ?? [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    const status = msg === 'Authentication required' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
