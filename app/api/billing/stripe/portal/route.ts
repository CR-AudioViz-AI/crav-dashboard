// app/api/billing/stripe/portal/route.ts
// javari-dashboard — Stripe billing portal (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-10-29.clover' })

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requirePermission('billing:manage')
    const supabase = createServiceClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dashboard.craudiovizai.com'
    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: `${baseUrl}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[billing/stripe/portal]', err)
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
