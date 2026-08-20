// app/api/me/credits/route.ts — the signed-in user's own credits
//
// 2026-08-20: app/credits/page.tsx read this itself with a SERVICE-ROLE client
// and then called supabase.auth.getUser() with NO ARGUMENT. A service-role client
// has no session and no cookies, so that returned null on every single request.
// The page "redirected" to sign-in, and redirect() in a page component renders a
// blank page rather than issuing a 307. The credits page has never shown anyone
// their balance.
//
// Identity now comes from the bearer token, which is where it lives here -
// sessions are in localStorage, not cookies.
//
// CR AudioViz AI · EIN 39-3646201 · August 2026
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/api/require-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  try {
    const supabase = createServiceClient();

    // maybeSingle, not single: a brand-new account has no wallet row yet, and
    // single() reports that ordinary case as an error.
    const [{ data: wallet }, { data: txns, error }] = await Promise.all([
      supabase
        .from("user_credits")
        .select("balance, plan, lifetime_earned, next_refresh_at")
        .eq("user_id", auth.userId)
        .maybeSingle(),
      supabase
        .from("credit_transactions")
        .select("id, type, action, amount, balance_after, description, created_at")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      {
        // A missing wallet means zero, not unknown. Returning null would let the
        // UI render an empty balance that looks like a permanent loading state.
        wallet: wallet ?? { balance: 0, plan: "free", lifetime_earned: 0, next_refresh_at: null },
        transactions: txns ?? [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load credits" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
