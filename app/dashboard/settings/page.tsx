// app/dashboard/settings/page.tsx
// CR AudioViz AI Settings - REAL Supabase Data
// Timestamp: 2025-11-28 15:20 UTC

import { createServiceClient } from "@/lib/supabase/server";
import {
  Settings,
  User,
  Building2,
  Shield,
  Bell,
  Key,
  Users,
  Mail,
  Globe,
  Database,
  Activity,
} from "lucide-react";

async function getSettingsData() {
  const supabase = createServiceClient();

  // Get all profiles (team members)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  // Get organizations
  const { data: organizations } = await supabase
    .from("organizations")
    .select("*")
    .limit(10);

  // Get system settings
  const { data: systemSettings } = await supabase
    .from("system_settings")
    .select("*")
    .limit(20);

  // Get API keys
  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, is_active")
    .order("created_at", { ascending: false })
    .limit(10);

  // Get platform settings
  const { data: platformSettings } = await supabase
    .from("platform_settings")
    .select("*")
    .single();

  return {
    profiles: profiles || [],
    organizations: organizations || [],
    systemSettings: systemSettings || [],
    apiKeys: apiKeys || [],
    platformSettings: platformSettings || {},
  };
}

function formatDate(dateString: string) {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function SettingsPage() {
  const { profiles, organizations, systemSettings, apiKeys, platformSettings } =
    await getSettingsData();

  const adminUsers = profiles.filter((p) => p.role === "admin" || p.is_admin);
  const regularUsers = profiles.filter((p) => p.role !== "admin" && !p.is_admin);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8 text-blue-600" />
          Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your account, team, and platform settings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500">Team Members</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{profiles.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-500">Admins</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{adminUsers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-500">API Keys</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{apiKeys.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-500">Organizations</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{organizations.length}</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-500 mt-1">
              {profiles.length} users from profiles table
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
            Invite Member
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {(profile.first_name?.[0] || profile.email?.[0] || "U").toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.first_name} {profile.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{profile.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        profile.role === "admin" || profile.is_admin
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {profile.role || (profile.is_admin ? "Admin" : "User")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(profile.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        profile.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {profile.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-yellow-500" />
              API Keys
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {apiKeys.length} keys from api_keys table
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
            Create New Key
          </button>
        </div>
        {apiKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {key.name || "Unnamed Key"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {key.key_prefix}...****
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(key.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(key.last_used_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          key.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {key.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No API keys created yet</p>
          </div>
        )}
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-500" />
            System Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide settings from system_settings table
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={platformSettings?.platform_name || "CR AudioViz AI"}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={platformSettings?.support_email || "support@craudiovizai.com"}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Credits
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={platformSettings?.default_credits || 100}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maintenance Mode
            </label>
            <div className="flex items-center">
              <span
                className={`px-3 py-2 rounded ${
                  platformSettings?.maintenance_mode
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {platformSettings?.maintenance_mode ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
