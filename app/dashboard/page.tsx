// app/dashboard/page.tsx
// CR AudioViz AI Admin Dashboard - REAL Supabase Data
// Timestamp: 2025-11-28 14:52 UTC
// Replaces all mock data with live Supabase queries

import Link from "next/link";
import {
  Crown,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Gauge,
  Package2,
  Wallet2,
  Zap,
  Users,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";

/* ---------- Small presentational helpers (server-safe) ---------- */

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm text-slate-600">{label}</div>
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
      </div>
      <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
          {trend === "down" && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function AppTile({
  name,
  blurb,
  href = "#",
  free = false,
  credits_cost = 0,
  category,
}: {
  name: string;
  blurb: string;
  href?: string;
  free?: boolean;
  credits_cost?: number;
  category?: string;
}) {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-slate-900">
            {name}
          </h3>
          {category && (
            <span className="text-xs text-slate-500">{category}</span>
          )}
        </div>
        <span
          className={`badge ${
            free ? "bg-green-50 text-green-700 border-green-200" : ""
          }`}
        >
          {free ? "Free" : `${credits_cost} credits`}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600 flex-1">{blurb}</p>
      <div className="mt-4">
        <Link href={href} className="btn btn-primary" target="_blank" rel="noopener">
          Open
        </Link>
      </div>
    </div>
  );
}

/* ---------- Data Fetching ---------- */

async function getDashboardData() {
  const supabase = createServiceClient();
  
  // Fetch apps from database
  const { data: apps, error: appsError } = await supabase
    .from("apps")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);
  
  // Count total apps
  const { count: totalApps } = await supabase
    .from("apps")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  
  // Count total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  
  // Get admin stats
  const { data: adminStats } = await supabase
    .from("admin_stats")
    .select("*")
    .single();
  
  // Get credit transactions for revenue calculation
  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("amount, type")
    .eq("type", "purchase");
  
  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  
  // Get system health (bot executions in last 24h)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { count: botExecutions } = await supabase
    .from("bot_executions")
    .select("*", { count: "exact", head: true })
    .gte("started_at", yesterday.toISOString());
  
  // Get recent errors count
  const { count: recentErrors } = await supabase
    .from("error_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterday.toISOString());
  
  return {
    apps: apps || [],
    totalApps: totalApps || 0,
    totalUsers: totalUsers || 0,
    adminStats: adminStats || { active_alerts: 0, events_24h: 0 },
    totalRevenue,
    botExecutions: botExecutions || 0,
    recentErrors: recentErrors || 0,
    systemStatus: (recentErrors || 0) > 10 ? "warning" : "healthy",
  };
}

/* ---------- Page ---------- */

export default async function DashboardPage() {
  // Fetch REAL data from Supabase
  const {
    apps,
    totalApps,
    totalUsers,
    adminStats,
    totalRevenue,
    botExecutions,
    recentErrors,
    systemStatus,
  } = await getDashboardData();

  // Admin check from environment (will be replaced with real auth)
  const isAdmin =
    (process.env.NEXT_PUBLIC_SHOW_ADMIN || "").toLowerCase() === "true";

  return (
    <main>
      {/* Hero / Intro */}
      <section className="container mx-auto max-w-[1200px] px-4 pt-6">
        <div className="card p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Welcome to CRAV Dashboard
              </h1>
              <p className="mt-2 text-slate-600">
                Unified command center for <strong>apps</strong>,{" "}
                <strong>credits</strong>, and <strong>billing</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <span className="badge bg-violet-50 text-violet-700 border-violet-200">
                  <Crown className="h-4 w-4" />
                  Admin
                </span>
              )}
              <span className={`badge ${
                systemStatus === "healthy" 
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}>
                {systemStatus === "healthy" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {systemStatus === "healthy" ? "All Systems Operational" : "Warnings Detected"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Row - REAL DATA */}
      <section className="container mx-auto max-w-[1200px] px-4 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total Apps"
          value={String(totalApps)}
          hint="active applications"
          icon={Sparkles}
        />
        <Stat
          label="Total Users"
          value={String(totalUsers)}
          hint="registered accounts"
          icon={Users}
          trend="up"
        />
        <Stat
          label="Bot Executions (24h)"
          value={String(botExecutions)}
          hint="autonomous operations"
          icon={Activity}
        />
        <Stat
          label="System Health"
          value={recentErrors === 0 ? "100%" : `${Math.max(0, 100 - recentErrors)}%`}
          hint={`${recentErrors} errors in last 24h`}
          icon={Gauge}
          trend={recentErrors === 0 ? "up" : "down"}
        />
      </section>

      {/* Apps Catalog - REAL DATA */}
      <section className="container mx-auto max-w-[1200px] px-4 mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              <span className="inline-flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Apps Catalog
              </span>
            </h2>
            <p className="text-sm md:text-base text-slate-600">
              {totalApps} active applications. Real data from Supabase.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/apps" className="btn btn-outline">
              View all ({totalApps})
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map((app) => (
            <AppTile
              key={app.id}
              name={app.name}
              blurb={app.description || "No description available"}
              href={app.url || "#"}
              free={app.is_free}
              credits_cost={app.credits_cost}
              category={app.category}
            />
          ))}
        </div>
      </section>

      {/* Admin Stats Section */}
      {isAdmin && (
        <section className="container mx-auto max-w-[1200px] px-4 mt-10">
          <div className="card p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Admin Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-quiet p-4">
                <div className="text-sm text-slate-600">Active Alerts</div>
                <div className="text-2xl font-bold mt-1">
                  {adminStats.active_alerts || 0}
                </div>
              </div>
              <div className="card-quiet p-4">
                <div className="text-sm text-slate-600">Events (24h)</div>
                <div className="text-2xl font-bold mt-1">
                  {adminStats.events_24h || botExecutions}
                </div>
              </div>
              <div className="card-quiet p-4">
                <div className="text-sm text-slate-600">Total Revenue</div>
                <div className="text-2xl font-bold mt-1">
                  ${totalRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="container mx-auto max-w-[1200px] px-4 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credits Management */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-slate-900">Unified Credits</h3>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            One balance powers all apps. Share across tools, carry over, and top-up anytime.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/credits" className="btn btn-outline">
              Manage Credits
            </Link>
            <Link href="/dashboard/apps" className="btn btn-ghost">
              Browse Apps
            </Link>
          </div>
        </div>

        {/* Billing & Payments */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-slate-900">Billing & Payments</h3>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            Upgrade your plan or purchase credits via Stripe or PayPal.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/api/billing/stripe/checkout" className="btn btn-primary">
              <CreditCard className="h-4 w-4" />
              Pay with Stripe
            </Link>
            <Link href="/dashboard/billing" className="btn btn-ghost">
              Billing Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto max-w-[1200px] px-4 mt-10 mb-8">
        <div className="card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-900">
                Real-time data from Supabase
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                All metrics, apps, and stats are pulled live from your database.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/apps" className="btn btn-primary">
                Explore Apps
              </Link>
              <Link href="/dashboard/settings" className="btn btn-ghost">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
