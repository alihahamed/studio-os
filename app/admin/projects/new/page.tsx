"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";

export default function NewProjectPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          clerk_org_id: organization?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const { project } = await res.json();
      router.push(`/admin/projects/${project.id}/proposal`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">
          New Project
        </h1>
        <p className="mt-1 text-sm text-surface-400">
          Create a project, then draft a proposal for your client.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="project-title"
            className="mb-2 block text-sm font-medium text-surface-200"
          >
            Project Title
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Corporate Directory for Acme Inc."
            className="w-full rounded-lg border border-surface-700 bg-surface-850 px-4 py-3 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
