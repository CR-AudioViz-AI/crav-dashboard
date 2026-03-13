// app/api/webhooks/paypal/route.ts
// javari-dashboard — PayPal webhook handler (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json()
    const event = body.event_type as string

    if (!event) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    const supabase  = createServiceClient()
    const eventId   = body.id as string
    const resource  = body.resource ?? {}

    // Idempotency
    const { data: existing } = await supabase.from('webhook_events').select('id,processed').eq('event_id', eventId).single()
    if (existing?.processed) return NextResponse.json({ received: true, cached: true })

    await supabase.from('webhook_events').upsert(
      { provider: 'paypal', event_type: event, event_id: eventId, payload: body, processed: false },
      { onConflict: 'event_id' }
    )

    if (event === 'PAYMENT.CAPTURE.COMPLETED') {
      const userId       = resource.custom_id ?? resource.purchase_units?.[0]?.custom_id
      const amountValue  = parseFloat(resource.amount?.value ?? '0')
      const credits      = Math.floor(amountValue) * 100

      if (userId && credits > 0) {
        const { data: wallet } = await supabase.from('user_credits').select('balance').eq('user_id', userId).single()
        if (wallet) {
          const newBalance = wallet.balance + credits
          await supabase.from('user_credits').update({ balance: newBalance }).eq('user_id', userId)
          await supabase.from('credit_transactions').insert({
            user_id: userId, type: 'topup', action: 'paypal_payment',
            amount: credits, balance_before: wallet.balance, balance_after: newBalance,
            description: 'Credit top-up via PayPal', operation: eventId,
          })
          await createAuditLog({ userId, action: 'credits.topup', target: 'credits', meta: { credits, provider: 'paypal' } })
        }
      }
    }

    await supabase.from('webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('event_id', eventId)

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('[paypal/webhook]', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
