// app/api/credits/spend/route.ts
// javari-dashboard — spend credits (Supabase)
// Uses platform CreditsOS pattern from lib/credits/index.ts
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission('credits:spend')
    const body = await req.json()
    const { taskType, amount, meta = {} } = body

    if (!taskType || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'taskType (string) and amount (positive number) are required', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    const idempotencyKey = req.headers.get('idempotency-key') ?? nanoid()
    const supabase = createServiceClient()

    // Check idempotency
    const { data: existingTxn } = await supabase
      .from('credit_transactions')
      .select('id, balance_after')
      .eq('user_id', userId)
      .eq('operation', idempotencyKey)
      .single()

    if (existingTxn) {
      return NextResponse.json({
        success: true,
        balance: existingTxn.balance_after,
        txnId:   existingTxn.id,
        cached:  true,
      })
    }

    // Fetch current balance
    const { data: wallet, error: walletErr } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (walletErr || !wallet) {
      return NextResponse.json({ error: 'Wallet not found', code: 'NO_WALLET' }, { status: 404 })
    }

    if (wallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      )
    }

    const newBalance = wallet.balance - amount

    // Deduct and record
    const { error: updateErr } = await supabase
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (updateErr) throw new Error(updateErr.message)

    const { data: txn, error: txnErr } = await supabase
      .from('credit_transactions')
      .insert({
        user_id:        userId,
        type:           'spend',
        action:         taskType,
        amount:         -amount,
        balance_before: wallet.balance,
        balance_after:  newBalance,
        description:    `Spent ${amount} credits on ${taskType}`,
        operation:      idempotencyKey,
      })
      .select('id')
      .single()

    if (txnErr) throw new Error(txnErr.message)

    await createAuditLog({
      userId,
      action:   'credits.spend',
      target:   'credits',
      targetId: txn?.id,
      meta:     { taskType, amount, ...meta },
    })

    return NextResponse.json({ success: true, balance: newBalance, txnId: txn?.id, charged: amount })
  } catch (err: unknown) {
    console.error('[credits/spend]', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    if (msg === 'Authentication required') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
