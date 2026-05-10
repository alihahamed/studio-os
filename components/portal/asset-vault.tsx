"use client";

import { useEffect, useMemo, useState } from "react";

interface Asset {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  download_url: string | null;
}

async function fetchAssets(projectId: string) {
  const res = await fetch(`/api/assets?project_id=${projectId}`);
  if (!res.ok) {
    throw new Error("Failed to load assets");
  }

  const data = await res.json();
  return (data.assets ?? []) as Asset[];
}

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data.error || "Upload failed";
  } catch {
    return "Upload failed before the server returned details";
  }
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetVault({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const selectedLabel = useMemo(() => {
    if (files.length === 0) return "No files selected";
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected`;
  }, [files]);

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      try {
        const nextAssets = await fetchAssets(projectId);
        if (isMounted) setAssets(nextAssets);
      } catch {
        if (isMounted) setError("Failed to load assets");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadAssets();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  async function uploadFiles() {
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("project_id", projectId);
        formData.append("file", file);

        const res = await fetch("/api/assets", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(await readError(res));
        }
      }

      setFiles([]);
      setAssets(await fetchAssets(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-surface-50">Asset Vault</h2>
            <p className="mt-1 text-sm text-surface-400">
              Upload brand files, briefs, credentials, and project documents.
            </p>
          </div>
          <button
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-surface-700 bg-surface-950 px-6 py-12 text-center transition-colors hover:border-brand-500/60">
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          <span className="text-sm font-medium text-surface-200">
            Choose files
          </span>
          <span className="mt-2 max-w-full truncate text-xs text-surface-500">
            {selectedLabel}
          </span>
          <span className="mt-2 text-xs text-surface-600">
            Images, SVG, PDF, ZIP, text, fonts. Max 50MB each.
          </span>
        </label>

        {error && (
          <p className="mt-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-surface-800 bg-surface-900">
        <div className="border-b border-surface-800 px-6 py-4">
          <h3 className="text-sm font-medium text-surface-200">
            Uploaded Assets
          </h3>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-surface-500">Loading assets...</p>
        ) : assets.length === 0 ? (
          <p className="px-6 py-8 text-sm text-surface-500">
            No assets uploaded yet.
          </p>
        ) : (
          <div className="divide-y divide-surface-800">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-surface-100">
                    {asset.file_name}
                  </p>
                  <p className="mt-1 text-xs text-surface-500">
                    {formatBytes(asset.size_bytes)} ·{" "}
                    {new Date(asset.created_at).toLocaleDateString()}
                  </p>
                </div>
                {asset.download_url && (
                  <a
                    href={asset.download_url}
                    className="text-sm font-medium text-brand-400 hover:text-brand-300"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
