// app/api/developer/apps/validate/route.ts
// javari-dashboard — validate app manifest (Supabase)
// Friday, March 13, 2026

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { z } from 'zod'

const ManifestSchema = z.object({
  appId:       z.string().min(3).max(64).regex(/^[a-z0-9-]+$/),
  name:        z.string().min(1).max(100),
  version:     z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500).optional(),
  entrypoint:  z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    await requirePermission('apps:publish')
    const body = await req.json()
    const result = ManifestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { valid: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true, manifest: result.data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
