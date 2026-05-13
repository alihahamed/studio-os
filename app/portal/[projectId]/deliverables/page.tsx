import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const ASSET_BUCKET = "project-assets";

function formatBytes(bytes: number | null) {
  if (!bytes) return "External link";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DeliverablesPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await props.params;
  const supabase = createAdminClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, status")
    .eq("id", projectId)
    .single();

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-surface-400">Project not found.</p>
      </div>
    );
  }

  if (project.status === "completed") {
    return (
      <div className="space-y-8">
        <Link
          href={`/portal/${projectId}`}
          className="text-sm text-surface-500 hover:text-surface-300"
        >
          Back to project
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-surface-50">
            Deliverables
          </h1>
          <p className="mt-2 text-sm text-surface-400">
            Final payment required before handoff unlocks.
          </p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-8 text-center">
          <Link
            href={`/portal/${projectId}/payment?type=final`}
            className="inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Pay Final Balance
          </Link>
        </div>
      </div>
    );
  }

  if (project.status !== "maintenance") {
    return (
      <div className="space-y-8">
        <Link
          href={`/portal/${projectId}`}
          className="text-sm text-surface-500 hover:text-surface-300"
        >
          Back to project
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-surface-50">
            Deliverables
          </h1>
          <p className="mt-2 text-sm text-surface-400">
            Deliverables unlock after final payment.
          </p>
        </div>
      </div>
    );
  }

  const { data: deliverables } = await supabase
    .from("project_deliverables")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const deliverablesWithUrls = await Promise.all(
    (deliverables ?? []).map(async (deliverable) => {
      if (!deliverable.storage_path) {
        return { ...deliverable, download_url: null };
      }

      const { data } = await supabase.storage
        .from(ASSET_BUCKET)
        .createSignedUrl(deliverable.storage_path, 60 * 10);

      return {
        ...deliverable,
        download_url: data?.signedUrl ?? null,
      };
    })
  );

  return (
    <div className="space-y-8">
      <Link
        href={`/portal/${projectId}`}
        className="text-sm text-surface-500 hover:text-surface-300"
      >
        Back to project
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-surface-50">
          Deliverables
        </h1>
        <p className="mt-2 text-sm text-surface-400">
          Final handoff for {project.title}.
        </p>
      </div>

      <div className="rounded-xl border border-surface-800 bg-surface-900">
        <div className="border-b border-surface-800 px-6 py-4">
          <h2 className="text-sm font-medium text-surface-200">
            Handoff Package
          </h2>
        </div>

        {deliverablesWithUrls.length === 0 ? (
          <p className="px-6 py-8 text-sm text-surface-500">
            No deliverables added yet.
          </p>
        ) : (
          <div className="divide-y divide-surface-800">
            {deliverablesWithUrls.map((deliverable) => (
              <div key={deliverable.id} className="px-6 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-surface-100">
                      {deliverable.title}
                    </p>
                    {deliverable.description && (
                      <p className="mt-1 text-xs text-surface-500">
                        {deliverable.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-surface-600">
                      {formatBytes(deliverable.size_bytes)}
                    </p>
                  </div>
                  <div className="flex gap-3 text-sm">
                    {deliverable.url && (
                      <a
                        href={deliverable.url}
                        className="font-medium text-brand-400 hover:text-brand-300"
                      >
                        Open
                      </a>
                    )}
                    {deliverable.download_url && (
                      <a
                        href={deliverable.download_url}
                        className="font-medium text-brand-400 hover:text-brand-300"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
