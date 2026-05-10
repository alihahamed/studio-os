import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function ProjectsPage() {
  const { orgId } = await auth();
  const supabase = createAdminClient();

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, contracts(total_price), payments(amount, status)")
    .eq("agency_id", agency?.id ?? "")
    .order("created_at", { ascending: false });

  const statusColors: Record<string, string> = {
    draft: "bg-surface-700 text-surface-300",
    proposal_sent: "bg-brand-600/10 text-brand-400",
    signed: "bg-brand-600/20 text-brand-300",
    awaiting_deposit: "bg-warning/10 text-warning",
    active: "bg-success/10 text-success",
    completed: "bg-brand-600/10 text-brand-400",
    maintenance: "bg-surface-600 text-surface-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-surface-50">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          + New Project
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-700 p-16 text-center">
          <p className="text-lg text-surface-400">No projects yet</p>
          <p className="mt-2 text-sm text-surface-500">
            Create your first project to get started.
          </p>
          <Link
            href="/admin/projects/new"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800 bg-surface-900">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {projects.map((project) => {
                const contractValue =
                  project.contracts?.[0]?.total_price ?? null;

                return (
                  <tr
                    key={project.id}
                    className="bg-surface-950 transition-colors hover:bg-surface-900"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="font-medium text-surface-100 hover:text-brand-400"
                      >
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[project.status] ?? "bg-surface-700 text-surface-300"}`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-300">
                      {contractValue
                        ? `$${(contractValue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {new Date(project.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
