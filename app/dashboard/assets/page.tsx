// app/dashboard/assets/page.tsx
// CR AudioViz AI Assets Management - REAL Supabase Data
// Timestamp: 2025-11-28 15:29 UTC

import { createServiceClient } from "@/lib/supabase/server";
import {
  Image,
  FileText,
  Music,
  Video,
  File,
  Download,
  Trash2,
  Upload,
  FolderOpen,
  HardDrive,
  Clock,
  Eye,
  Filter,
  Grid,
  List,
} from "lucide-react";

async function getAssetsData() {
  const supabase = createServiceClient();

  // Get assets from the assets table
  const { data: assets, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Get documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get AI generations (logos, images, etc.)
  const { data: generations } = await supabase
    .from("ai_generations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // Calculate storage stats
  const totalAssets = (assets?.length || 0) + (documents?.length || 0) + (generations?.length || 0);
  
  // Estimate storage (simplified - would need actual file sizes)
  const estimatedStorage = totalAssets * 0.5; // Assume 0.5 MB average

  return {
    assets: assets || [],
    documents: documents || [],
    generations: generations || [],
    stats: {
      totalAssets,
      images: assets?.filter((a) => a.type?.startsWith("image")).length || 0,
      documents: documents?.length || 0,
      generations: generations?.length || 0,
      estimatedStorage,
    },
  };
}

function getFileIcon(type: string | null) {
  if (!type) return <File className="h-8 w-8 text-gray-400" />;
  if (type.startsWith("image")) return <Image className="h-8 w-8 text-blue-500" />;
  if (type.startsWith("video")) return <Video className="h-8 w-8 text-purple-500" />;
  if (type.startsWith("audio")) return <Music className="h-8 w-8 text-green-500" />;
  if (type.includes("pdf") || type.includes("document")) return <FileText className="h-8 w-8 text-red-500" />;
  return <File className="h-8 w-8 text-gray-400" />;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes: number) {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetCard({
  asset,
}: {
  asset: {
    id: string;
    name?: string;
    type?: string;
    url?: string;
    size?: number;
    created_at: string;
  };
}) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{getFileIcon(asset.type)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {asset.name || "Unnamed Asset"}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {asset.type || "Unknown type"} • {formatFileSize(asset.size || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatDate(asset.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-500 transition"
            >
              <Eye className="h-4 w-4" />
            </a>
          )}
          <button className="p-2 text-gray-400 hover:text-green-500 transition">
            <Download className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-500 transition">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default async function AssetsPage() {
  const { assets, documents, generations, stats } = await getAssetsData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FolderOpen className="h-8 w-8 text-blue-600" />
          Assets Library
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your files, documents, and AI-generated content
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total Assets</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAssets}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-500">Images</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.images}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-500" />
            <span className="text-sm text-gray-500">Documents</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.documents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-500">AI Generations</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.generations}</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          Upload Files
        </h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop files here, or click to select files
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supports images, documents, audio, and video files
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
            Select Files
          </button>
        </div>
      </div>

      {/* Assets Grid */}
      {assets.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Assets</h2>
              <p className="text-sm text-gray-500 mt-1">
                {assets.length} files from assets table
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded border">
                <Grid className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded border">
                <List className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded border">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              Documents
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length} documents from documents table
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <AssetCard
                key={doc.id}
                asset={{
                  id: doc.id,
                  name: doc.title || doc.name,
                  type: doc.type || "document",
                  url: doc.url,
                  size: doc.size,
                  created_at: doc.created_at,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Generations Section */}
      {generations.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-500" />
              AI Generations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {generations.length} AI-generated assets
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {gen.type || "Generation"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {gen.prompt?.slice(0, 50) || "No prompt"}...
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(gen.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalAssets === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
          <p className="text-gray-500 mb-4">
            Upload files or generate content with AI tools to see them here.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Upload Your First File
          </button>
        </div>
      )}

      {/* Storage Info */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Storage Information
        </h3>
        <p className="text-blue-800 text-sm">
          Assets are stored securely in Supabase Storage. All uploads are
          automatically optimized and backed up. Premium plans include additional
          storage capacity and CDN delivery.
        </p>
      </div>
    </div>
  );
}
