// app/api/billing/stripe/checkout/route.ts
// javari-dashboard — Stripe checkout (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail } = await requirePermission('billing:manage')
    const { priceId, mode } = await req.json()

    if (!priceId || !mode) {
      return NextResponse.json({ error: 'priceId and mode are required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email: userEmail, metadata: { userId } })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dashboard.craudiovizai.com'
    const session = await stripe.checkout.sessions.create({
      customer:    customerId,
      line_items:  [{ price: priceId, quantity: 1 }],
      mode:        mode as 'subscription' | 'payment',
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url:  `${baseUrl}/billing?canceled=true`,
      metadata:    { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[billing/stripe/checkout]', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    const status = msg === 'Authentication required' ? 401 : msg.includes('Permission') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
