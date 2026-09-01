import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

export const PLAN_PRICE_IDS = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  PRO: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
  SCALE: process.env.STRIPE_SCALE_PRICE_ID || 'price_scale',
};

export const TOPUP_PRICE_IDS = {
  PACK_100: process.env.STRIPE_TOPUP_100_PRICE_ID || 'price_topup_100',
  PACK_500: process.env.STRIPE_TOPUP_500_PRICE_ID || 'price_topup_500',
  PACK_1000: process.env.STRIPE_TOPUP_1000_PRICE_ID || 'price_topup_1000',
};

export async function createStripeCustomer(email: string, name?: string) {
  return stripe.customers.create({
    email,
    name,
  });
}

export async function createCheckoutSession({
  customerId,
  priceId,
  mode,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId: string;
  priceId: string;
  mode: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
