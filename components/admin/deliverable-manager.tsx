"use client";

import { useEffect, useState } from "react";

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  file_name: string | null;
  download_url: string | null;
  created_at: string;
}

async function fetchDeliverables(projectId: string) {
  const res = await fetch(`/api/deliverables?project_id=${projectId}`);
  if (!res.ok) throw new Error("Failed to load deliverables");
  const data = await res.json();
  return (data.deliverables ?? []) as Deliverable[];
}

export function DeliverableManager({ projectId }: { projectId: string }) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const next = await fetchDeliverables(projectId);
        if (mounted) setDeliverables(next);
      } catch {
        if (mounted) setError("Failed to load deliverables");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  async function addDeliverable() {
    if (!title.trim()) {
      setError("Title required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("url", url);
      if (file) formData.append("file", file);

      const res = await fetch("/api/deliverables", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add deliverable");
      }

      setTitle("");
      setDescription("");
      setUrl("");
      setFile(null);
      setDeliverables(await fetchDeliverables(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add deliverable");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
      <div className="mb-5">
        <h3 className="text-sm font-medium text-surface-300">Deliverables</h3>
        <p className="mt-1 text-xs text-surface-500">
          Add final files or links for client handoff.
        </p>
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-sm text-surface-100 outline-none focus:border-brand-500"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-sm text-surface-100 outline-none focus:border-brand-500"
        />
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="External URL (optional)"
          className="w-full rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-sm text-surface-100 outline-none focus:border-brand-500"
        />
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-surface-400 file:mr-4 file:rounded-lg file:border-0 file:bg-surface-800 file:px-4 file:py-2 file:text-sm file:text-surface-100"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          onClick={addDeliverable}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Deliverable"}
        </button>
      </div>

      <div className="mt-6 border-t border-surface-800 pt-5">
        {loading ? (
          <p className="text-sm text-surface-500">Loading deliverables...</p>
        ) : deliverables.length === 0 ? (
          <p className="text-sm text-surface-500">No deliverables yet.</p>
        ) : (
          <div className="space-y-3">
            {deliverables.map((deliverable) => (
              <div key={deliverable.id} className="rounded-lg bg-surface-950 p-3">
                <p className="text-sm font-medium text-surface-100">
                  {deliverable.title}
                </p>
                {deliverable.description && (
                  <p className="mt-1 text-xs text-surface-500">
                    {deliverable.description}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs">
                  {deliverable.url && (
                    <a
                      href={deliverable.url}
                      className="text-brand-400 hover:text-brand-300"
                    >
                      Open link
                    </a>
                  )}
                  {deliverable.download_url && (
                    <a
                      href={deliverable.download_url}
                      className="text-brand-400 hover:text-brand-300"
                    >
                      Download file
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
