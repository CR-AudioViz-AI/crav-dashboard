// app/api/admin/webhook-events/route.ts — payment webhook log, admins only
//
// 2026-08-20: app/billing/events/page.tsx read this with a service-role client
// and getUser() with no argument, which always returned null - so the page was
// blank for everyone. But note what it was showing: EVERY webhook event on the
// platform, with no user filter at all.
//
// That is admin data. The page only ever checked "is someone signed in", so had
// the auth worked, any signed-in customer would have seen the payment webhook log
// for every other customer. Fixing the auth without adding the role check would
// have converted a blank page into a data leak.
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", auth.userId)
      .maybeSingle();

    const p = profile as { role?: string; is_admin?: boolean } | null;
    const isAdmin = p?.role === "admin" || p?.role === "super_admin" || p?.is_admin === true;
    if (!isAdmin) {
      // 403, not 404: the caller is authenticated and simply not permitted.
      return NextResponse.json(
        { error: "Forbidden", code: "ADMIN_REQUIRED" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { data: events, error } = await supabase
      .from("webhook_events")
      .select("id, provider, event_type, event_id, processed, processed_at, error, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ events: events ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load webhook events" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
