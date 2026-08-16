// app/sitemap.ts — the pages this app wants indexed
//
// 2026-08-16: this app had no sitemap, so discovery depended on a crawler
// finding an internal link. Generated rather than static, so it cannot drift
// out of date as pages are added.
import type { MetadataRoute } from 'next'

const BASE = 'https://dashboard.craudiovizai.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/auth/error`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/auth/signin`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/auth/verify`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/billing/events`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/credits`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/dashboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/dashboard/apps`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/dashboard/assets`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/dashboard/billing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/dashboard/credits`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/dashboard/settings`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]
}
