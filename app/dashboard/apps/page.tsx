// app/dashboard/apps/page.tsx
// CR AudioViz AI Apps Marketplace - REAL Supabase Data
// Timestamp: 2025-11-28 15:06 UTC

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Sparkles,
  ExternalLink,
  Star,
  Zap,
  Crown,
  Search,
  Filter,
  Grid,
  List,
} from "lucide-react";

// Category icons mapping
const categoryIcons: Record<string, string> = {
  "Core Platform": "🏠",
  "Creative Tools": "🎨",
  "Business Tools": "💼",
  "Marketing": "📣",
  "Analytics": "📊",
  "AI Tools": "🤖",
  "Games": "🎮",
  "Real Estate": "🏘️",
  "Finance": "💰",
  "Documents": "📄",
  "default": "⚡",
};

function getIcon(category: string): string {
  return categoryIcons[category] || categoryIcons["default"];
}

async function getAppsData() {
  const supabase = createServiceClient();

  // Fetch all active apps
  const { data: apps, error } = await supabase
    .from("apps")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching apps:", error);
    return { apps: [], categories: [], stats: { total: 0, free: 0, premium: 0 } };
  }

  // Get unique categories
  const categories = [...new Set(apps?.map((app) => app.category) || [])].filter(Boolean);

  // Calculate stats
  const stats = {
    total: apps?.length || 0,
    free: apps?.filter((app) => app.is_free).length || 0,
    premium: apps?.filter((app) => app.is_premium).length || 0,
  };

  return { apps: apps || [], categories, stats };
}

function AppCard({
  app,
}: {
  app: {
    id: string;
    name: string;
    description: string;
    category: string;
    url: string;
    credits_cost: number;
    is_free: boolean;
    is_premium: boolean;
    is_beta: boolean;
    rating: number;
    usage_count: number;
  };
}) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{getIcon(app.category)}</div>
        <div className="flex gap-2">
          {app.is_free && (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
              Free
            </span>
          )}
          {app.is_premium && (
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          )}
          {app.is_beta && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
              Beta
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.name}</h3>
      <p className="text-xs text-gray-500 mb-2">{app.category}</p>
      <p className="text-gray-600 text-sm mb-4 flex-1">
        {app.description || "No description available"}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {app.is_free ? (
            <span className="text-sm text-green-600 font-medium">Free to use</span>
          ) : (
            <span className="text-sm text-gray-500">
              <Zap className="h-3 w-3 inline mr-1" />
              {app.credits_cost} credits
            </span>
          )}
          {app.rating > 0 && (
            <span className="text-sm text-gray-500 flex items-center">
              <Star className="h-3 w-3 text-yellow-500 mr-1" />
              {app.rating.toFixed(1)}
            </span>
          )}
        </div>
        {app.url ? (
          <Link
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <button
            className="px-4 py-2 rounded text-sm font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
            disabled
          >
            Coming Soon
          </button>
        )}
      </div>
    </div>
  );
}

export default async function AppsPage() {
  const { apps, categories, stats } = await getAppsData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          Apps Marketplace
        </h1>
        <p className="mt-2 text-gray-600">
          {stats.total} applications available • {stats.free} free • {stats.premium} premium
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Apps</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Free Apps</div>
          <div className="text-2xl font-bold text-green-600">{stats.free}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Premium Apps</div>
          <div className="text-2xl font-bold text-purple-600">{stats.premium}</div>
        </div>
      </div>

      {/* Apps by Category */}
      {categories.map((category) => {
        const categoryApps = apps.filter((app) => app.category === category);
        if (categoryApps.length === 0) return null;

        return (
          <div key={category} className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>{getIcon(category)}</span>
              {category}
              <span className="text-sm font-normal text-gray-500">
                ({categoryApps.length} apps)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {apps.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No apps available</h3>
          <p className="text-gray-500">Check back soon for new applications.</p>
        </div>
      )}

      {/* Developer CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Want to publish your own app?
        </h3>
        <p className="text-blue-800 mb-4">
          Join our creator program and publish apps to reach thousands of users.
          Earn 70% of all revenue from your apps.
        </p>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Learn More
          <ExternalLink className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}
