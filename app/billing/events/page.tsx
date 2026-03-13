// app/billing/events/page.tsx
// javari-dashboard — Webhook events admin page (Supabase)
// Friday, March 13, 2026

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BillingEventsPage() {
  const supabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: events } = await supabase
    .from('webhook_events')
    .select('id, provider, event_type, event_id, processed, processed_at, error, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

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
