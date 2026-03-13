// lib/rbac.ts
// javari-dashboard — Role-based access control using Supabase Auth
// Friday, March 13, 2026

import { createClient } from '@/lib/supabase/server'

export type Permission =
  | 'credits:spend' | 'credits:view'
  | 'billing:manage' | 'billing:view'
  | 'apps:install' | 'apps:publish'
  | 'admin:read' | 'admin:write'

interface AuthContext {
  userId: string
  userEmail: string
  role: string
}

/** Verify session exists and optionally check permission.
 *  Throws a descriptive string on failure — caller wraps in 403/401 response. */
export async function requirePermission(permission?: Permission): Promise<AuthContext> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Authentication required')
  }

  // Fetch role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'user'

  // Admin bypass
  const ADMIN_EMAILS = [
    'royhenderson@craudiovizai.com',
    'cindyhenderson@craudiovizai.com',
    'roy@craudiovizai.com',
    'admin@craudiovizai.com',
  ]
  if (ADMIN_EMAILS.includes(user.email!)) {
    return { userId: user.id, userEmail: user.email!, role: 'admin' }
  }

  // Permission check (simple role-based)
  if (permission) {
    const allowed = checkRolePermission(role, permission)
    if (!allowed) throw new Error(`Permission denied: ${permission}`)
  }

  return { userId: user.id, userEmail: user.email!, role }
}

function checkRolePermission(role: string, permission: Permission): boolean {
  const rolePerms: Record<string, Permission[]> = {
    admin:  ['credits:spend','credits:view','billing:manage','billing:view','apps:install','apps:publish','admin:read','admin:write'],
    pro:    ['credits:spend','credits:view','billing:manage','billing:view','apps:install','apps:publish'],
    user:   ['credits:spend','credits:view','billing:view','apps:install'],
    viewer: ['credits:view','billing:view'],
  }
  return (rolePerms[role] ?? rolePerms.viewer).includes(permission)
}
