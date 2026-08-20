'use client'
// app/billing/events/page.tsx
// javari-dashboard — Webhook events admin page (Supabase)
// Friday, March 13, 2026

import { useEffect, useState } from 'react'

// 2026-08-20: same broken pattern - createServiceClient().auth.getUser() with no
// argument, always null, then a redirect() that renders blank.
//
// NOTE WHAT THIS PAGE SHOWS: every webhook event on the platform, with no user
// filter. It only ever checked "is someone signed in", so had the auth worked,
// any signed-in customer would have seen the payment webhook log for every other
// customer. Fixing the auth alone would have turned a blank page into a data
// leak, so /api/admin/webhook-events requires an ADMIN role and returns 403
// otherwise.
interface WebhookEvent {
  id: string; provider: string; event_type: string; event_id: string
  processed: boolean; processed_at: string | null; error: string | null; created_at: string
}

export default function BillingEventsPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'forbidden'>('loading')

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const { data: { session } } = await createClient().auth.getSession()
        if (!session) { if (live) setState('forbidden'); return }
        const res = await fetch('/api/admin/webhook-events', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        })
        if (!res.ok) { if (live) setState('forbidden'); return }
        const d = await res.json()
        if (!live) return
        setEvents((d.events ?? []) as WebhookEvent[])
        setState('ready')
      } catch {
        if (live) setState('forbidden')   // fail closed
      }
    })()
    return () => { live = false }
  }, [])

  if (state === 'loading') {
    return <div className="p-6"><div className="animate-pulse text-gray-500">Loading webhook events…</div></div>
  }
  if (state === 'forbidden') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Webhook Events</h1>
        <p className="text-gray-500 text-sm">This page is restricted to administrators.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Webhook Events</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Provider','Type','Event ID','Status','Processed At','Error'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(events ?? []).map(ev => (
              <tr key={ev.id}>
                <td className="px-4 py-2 capitalize">{ev.provider}</td>
                <td className="px-4 py-2 font-mono text-xs">{ev.event_type}</td>
                <td className="px-4 py-2 font-mono text-xs">{ev.event_id?.slice(0,16)}…</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${ev.processed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {ev.processed ? 'Processed' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">{ev.processed_at ? new Date(ev.processed_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-2 text-xs text-red-400 truncate max-w-xs">{ev.error ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!events || events.length === 0) && (
          <p className="text-center text-gray-400 py-8">No webhook events found.</p>
        )}
      </div>
    </div>
  )
}
