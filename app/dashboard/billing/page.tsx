// app/dashboard/billing/page.tsx
// CR AudioViz AI Billing Management - REAL Supabase Data
// Timestamp: 2025-11-28 15:15 UTC

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Building2,
  TrendingUp,
  Receipt,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";

async function getBillingData() {
  const supabase = createServiceClient();

  // Get subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  // Get payment transactions
  const { data: payments } = await supabase
    .from("payment_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get PayPal subscriptions
  const { data: paypalSubs } = await supabase
    .from("paypal_subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  // Calculate revenue
  const totalRevenue = payments?.reduce((sum, p) => {
    if (p.status === "completed" || p.status === "succeeded") {
      return sum + (p.amount || 0);
    }
    return sum;
  }, 0) || 0;

  // Active subscriptions count
  const activeSubscriptions = subscriptions?.filter(
    (s) => s.status === "active" || s.status === "trialing"
  ).length || 0;

  return {
    subscriptions: subscriptions || [],
    payments: payments || [],
    paypalSubs: paypalSubs || [],
    totalRevenue,
    activeSubscriptions,
  };
}

// Pricing plans (these could also come from a database table)
const plans = [
  {
    name: "Starter",
    price: 49,
    credits: 2500,
    features: [
      "2,500 credits/month",
      "Access to all 60+ apps",
      "Email support",
      "Community access",
      "Credits never expire",
    ],
    popular: false,
    stripePriceId: "price_starter",
  },
  {
    name: "Professional",
    price: 149,
    credits: 10000,
    features: [
      "10,000 credits/month",
      "Priority app access",
      "Priority support",
      "Advanced analytics",
      "API access",
      "White-label options",
    ],
    popular: true,
    stripePriceId: "price_professional",
  },
  {
    name: "Enterprise",
    price: 499,
    credits: 50000,
    features: [
      "50,000 credits/month",
      "Dedicated support",
      "Custom integrations",
      "Full API access",
      "SLA guarantee",
      "Custom development",
    ],
    popular: false,
    stripePriceId: "price_enterprise",
  },
];

const topUpOptions = [
  { credits: 500, price: 29 },
  { credits: 2000, price: 99 },
  { credits: 5000, price: 199 },
  { credits: 15000, price: 499 },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100); // Assuming amounts are in cents
}

export default async function BillingPage() {
  const { subscriptions, payments, totalRevenue, activeSubscriptions } =
    await getBillingData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-blue-600" />
          Billing & Subscriptions
        </h1>
        <p className="mt-2 text-gray-600">
          Manage subscriptions, view invoices, and purchase credits
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Active Subs</h3>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {activeSubscriptions}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
            <Receipt className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {payments.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">MRR</h3>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            ${(activeSubscriptions * 49).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Subscription Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg p-6 relative ${
                plan.popular ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-blue-600 font-medium">
                  {plan.credits.toLocaleString()} credits/month
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/api/billing/stripe/checkout?price=${plan.stripePriceId}`}
                className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Subscribe
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Top-Up */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Credit Top-Up
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topUpOptions.map((option) => (
            <div
              key={option.credits}
              className="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition"
            >
              <div className="text-3xl font-bold text-blue-600">
                {option.credits.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mb-4">credits</div>
              <div className="text-xl font-bold text-gray-900 mb-4">
                ${option.price}
              </div>
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Transactions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {payments.length} transactions from Supabase
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.type || "Payment"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          payment.status === "completed" ||
                          payment.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(payment.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Pay with Stripe
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Secure payment processing with credit/debit cards.
          </p>
          <Link
            href="/api/billing/stripe/checkout"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Stripe Checkout
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <img src="/icons/paypal.svg" alt="PayPal" className="h-5 w-5" />
            Pay with PayPal
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Use your PayPal account or pay with PayPal Credit.
          </p>
          <Link
            href="/api/billing/paypal/checkout"
            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
          >
            PayPal Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
