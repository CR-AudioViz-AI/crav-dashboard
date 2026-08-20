'use client'
// app/credits/page.tsx
// javari-dashboard — Credits overview page (Supabase)
// Friday, March 13, 2026

// 2026-08-20: this was a SERVER component that called
//   createServiceClient().auth.getUser()
// with NO ARGUMENT. A service-role client has no session and no cookies, so that
// returned null on EVERY request - the page then "redirected" to sign-in, and
// redirect() in a page component renders a blank page rather than issuing a 307.
// Nobody has ever seen their credit balance here.
//
// Data now comes from /api/me/credits, behind requireUser(), with identity taken
// from the bearer token because sessions live in localStorage on this platform.
import { useEffect, useState } from 'react'

interface Wallet { balance: number; plan: string; lifetime_earned: number; next_refresh_at: string | null }
interface Txn { id: string; type?: string; action?: string; amount: number; created_at: string }

export default function CreditsPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [txns, setTxns] = useState<Txn[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const { data: { session } } = await createClient().auth.getSession()
        if (!session) { if (live) setReady(true); return }
        const res = await fetch('/api/me/credits', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        })
        if (!res.ok) { if (live) setReady(true); return }
        const d = await res.json()
        if (!live) return
        setWallet(d.wallet as Wallet)
        setTxns((d.transactions ?? []) as Txn[])
        setReady(true)
      } catch {
        if (live) setReady(true)   // fail closed: shows zero, never someone else's
      }
    })()
    return () => { live = false }
  }, [])

  if (!ready) {
    return <div className="p-6"><div className="animate-pulse text-gray-500">Loading your credits…</div></div>
  }

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
