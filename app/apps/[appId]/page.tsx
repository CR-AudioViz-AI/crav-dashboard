// app/apps/[appId]/page.tsx
// CR AudioViz AI - Individual App Detail Page with REAL Supabase Data
// Timestamp: 2025-11-28 15:35 UTC

import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import ClientMount from "./plugin-client-mount";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Zap,
  Crown,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

async function getAppData(appId: string) {
  const supabase = createServiceClient();

  // Try to find by slug first, then by ID
  let { data: app, error } = await supabase
    .from("apps")
    .select("*")
    .eq("slug", appId)
    .single();

  if (!app) {
    // Try by ID
    const { data: appById } = await supabase
      .from("apps")
      .select("*")
      .eq("id", appId)
      .single();
    app = appById;
  }

  // Get usage stats for this app
  const { data: usageStats } = await supabase
    .from("app_usage")
    .select("*")
    .eq("app_id", app?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return { app, usageStats: usageStats || [] };
}

export default async function AppPanelPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const { app, usageStats } = await getAppData(appId);

  if (!app) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/dashboard/apps"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Apps
      </Link>

      {/* App Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="text-5xl">
              {app.icon_url ? (
                <img src={app.icon_url} alt={app.name} className="h-16 w-16 rounded-lg" />
              ) : (
                "⚡"
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{app.name}</h1>
              <p className="text-gray-500 mt-1">{app.category}</p>
              <div className="flex items-center gap-3 mt-3">
                {app.is_free && (
                  <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                    Free
                  </span>
                )}
                {app.is_premium && (
                  <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                )}
                {app.is_beta && (
                  <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Beta
                  </span>
                )}
                {app.rating > 0 && (
                  <span className="flex items-center text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    {app.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {app.url && (
              <Link
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Launch App
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <p className="text-gray-600 mt-6 text-lg">
          {app.description || "No description available"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Credits Cost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {app.is_free ? "Free" : `${app.credits_cost}`}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total Uses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {app.usage_count?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Rating</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {app.rating > 0 ? app.rating.toFixed(1) : "N/A"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-500">Status</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {app.is_active ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      {/* App Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Embedded App */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">App Preview</h2>
            <ClientMount appId={appId} />
          </div>

          {/* Recent Usage */}
          {usageStats.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Usage
              </h2>
              <div className="space-y-3">
                {usageStats.slice(0, 5).map((usage, i) => (
                  <div
                    key={usage.id || i}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-600">
                      {new Date(usage.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {usage.credits_used || 0} credits
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* App Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              App Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Category</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {app.category || "Uncategorized"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Slug</dt>
                <dd className="text-sm font-mono text-gray-900">{app.slug}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(app.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(app.updated_at).toLocaleDateString()}
                </dd>
              </div>
              {app.vercel_project_id && (
                <div>
                  <dt className="text-sm text-gray-500">Vercel Project</dt>
                  <dd className="text-sm font-mono text-gray-900 truncate">
                    {app.vercel_project_id}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {app.url && (
                <Link
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Open App
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <Link
                href="/dashboard/apps"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Browse All Apps
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
