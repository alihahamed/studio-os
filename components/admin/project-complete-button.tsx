"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectCompleteButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function markComplete() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark complete");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark complete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={markComplete}
        disabled={loading}
        className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Completing..." : "Mark Complete"}
      </button>
      {error && <p className="max-w-64 text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
