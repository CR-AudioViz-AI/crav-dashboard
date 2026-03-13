// app/credits/page.tsx
// javari-dashboard — Credits overview page (Supabase)
// Friday, March 13, 2026

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreditsPage() {
  const supabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: wallet } = await supabase
    .from('user_credits')
    .select('balance, plan, lifetime_earned, next_refresh_at')
    .eq('user_id', user.id)
    .single()

  const { data: txns } = await supabase
    .from('credit_transactions')
    .select('id, type, action, amount, balance_after, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Credits</h1>

      {/* Balance card */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Current Balance</p>
        <p className="text-4xl font-bold text-blue-600">{(wallet?.balance ?? 0).toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-1">Plan: <span className="capitalize font-medium">{wallet?.plan ?? 'free'}</span></p>
        {wallet?.next_refresh_at && (
          <p className="text-xs text-gray-400">Refreshes: {new Date(wallet.next_refresh_at).toLocaleDateString()}</p>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
        <div className="bg-white rounded-xl border divide-y shadow-sm">
          {(txns ?? []).map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium capitalize">{t.action ?? t.type}</p>
                <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className={`font-semibold ${t.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString()}
              </span>
            </div>
          ))}
          {(!txns || txns.length === 0) && (
            <p className="text-center text-gray-400 py-6 text-sm">No transactions yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
