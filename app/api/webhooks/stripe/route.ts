// app/api/webhooks/stripe/route.ts
// javari-dashboard — Stripe webhook handler (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// NOTE: No `export const config` — App Router handles raw body natively via req.text()

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Idempotency — skip already processed events
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id, processed')
    .eq('event_id', event.id)
    .single()

  if (existing?.processed) {
    return NextResponse.json({ received: true, cached: true })
  }

  // Record event
  const { data: webhookRow } = await supabase
    .from('webhook_events')
    .upsert(
      { provider: 'stripe', event_type: event.type, event_id: event.id, payload: event, processed: false },
      { onConflict: 'event_id' }
    )
    .select('id')
    .single()

  try {
    await processStripeEvent(event, supabase)
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', webhookRow?.id)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'processing error'
    console.error('[stripe/webhook] Processing error:', msg)
    await supabase.from('webhook_events').update({ error: msg }).eq('id', webhookRow?.id)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function processStripeEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createServiceClient>
) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.userId
      if (!userId) break

      if (session.mode === 'payment' && session.amount_total) {
        const credits = Math.floor(session.amount_total / 100) * 100
        const { data: wallet } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', userId)
          .single()

        if (wallet) {
          const newBalance = wallet.balance + credits
          await supabase
            .from('user_credits')
            .update({ balance: newBalance, lifetime_earned: newBalance })
            .eq('user_id', userId)
          await supabase.from('credit_transactions').insert({
            user_id:        userId,
            type:           'topup',
            action:         'stripe_payment',
            amount:         credits,
            balance_before: wallet.balance,
            balance_after:  newBalance,
            description:    'Credit top-up via Stripe',
            operation:      session.id,
          })
          await createAuditLog({
            userId,
            action:  'credits.topup',
            target:  'credits',
            meta:    { credits, provider: 'stripe', sessionId: session.id },
          })
        }
      }

      if (session.mode === 'subscription') {
        await supabase
          .from('user_credits')
          .update({ subscription_active: true })
          .eq('user_id', userId)
        await createAuditLog({
          userId,
          action: 'billing.subscription_created',
          target: 'subscription',
          meta:   { provider: 'stripe' },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', sub.customer as string)
        .single()

      if (profile) {
        await supabase
          .from('user_credits')
          .update({ subscription_active: false })
          .eq('user_id', profile.id)
        await createAuditLog({
          userId: profile.id,
          action: 'billing.subscription_canceled',
          target: 'subscription',
          meta:   { provider: 'stripe' },
        })
      }
      break
    }
  }
}
