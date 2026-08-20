// lib/api/require-user.ts — the auth gate for API routes
//
// Sessions live in localStorage on this platform (the browser client sets
// storage: window.localStorage, locked 2026-07-15), NOT in cookies. Nothing
// anywhere writes a Supabase auth cookie, so any route calling
// supabase.auth.getUser() on a cookie-backed client finds nothing and answers
// 401 to everyone - signed in or not. It never errors; it takes the
// unauthenticated path and looks like it is working.
//
// That bug broke 32 routes in the core platform, including the entire
// /api/customer surface and the GDPR/CCPA data-subject-rights endpoint. This
// file is how it is avoided: the access token arrives in the Authorization
// header, and Supabase verifies it.
//
// SELF-CONTAINED ON PURPOSE. It builds its own client from env and imports
// nothing from the host repo, because the branded apps do not share a layout.
// A helper that assumes the host's shape is a helper that gets forked, and forks
// are how this platform ended up with nine competing Supabase clients.
//
// CR AudioViz AI · EIN 39-3646201 · August 2026
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export type AuthResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; res: NextResponse };

function unauthorized(reason: string): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized", code: "AUTH_REQUIRED", reason },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * The verified caller, or a 401 response to return.
 *
 * Never trusts a user id from the request body or query string: that is the IDOR
 * pattern the platform's route-auth guardrail fails builds on. Identity comes
 * only from a token Supabase has verified.
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return { ok: false, res: unauthorized("no bearer token") };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Fail closed AND say so. A misconfigured deployment must not look like a
    // rejected sign-in, or nobody ever finds out it is misconfigured.
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Auth is not configured on this deployment" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return { ok: false, res: unauthorized("token rejected") };
    return { ok: true, userId: data.user.id, email: data.user.email ?? null };
  } catch {
    return { ok: false, res: unauthorized("verification failed") };
  }
}
