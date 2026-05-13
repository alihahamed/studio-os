import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const statusText: Record<string, string> = {
  draft: "Draft",
  proposal_sent: "Proposal ready",
  signed: "Signed",
  awaiting_deposit: "Deposit due",
  active: "Active workspace",
  completed: "Final payment due",
  maintenance: "Deliverables ready",
};

export default async function ClientProjectsPage() {
  const { userId, orgId } = await auth();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("clerk_user_id", userId)
    .single();

  const { data: agency } = orgId
    ? await supabase
        .from("agencies")
        .select("id")
        .eq("clerk_org_id", orgId)
        .single()
    : { data: null };

  const agencyId = profile?.agency_id ?? agency?.id;
  const { data: projects } = agencyId
    ? await supabase
        .from("projects")
        .select("id, title, status, updated_at")
        .eq("agency_id", agencyId)
        .order("updated_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/client" className="text-sm text-surface-500 hover:text-surface-300">
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-surface-50">
          Projects
        </h1>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-700 p-12 text-center">
          <p className="text-surface-400">No projects yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-800">
          <table className="w-full">
            <thead className="bg-surface-900">
              <tr className="border-b border-surface-800">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-surface-400">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-surface-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-surface-400">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {projects.map((project) => (
                <tr key={project.id} className="bg-surface-950 hover:bg-surface-900">
                  <td className="px-6 py-4">
                    <Link
                      href={`/client/projects/${project.id}`}
                      className="font-medium text-surface-100 hover:text-brand-400"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-300">
                    {statusText[project.status] ?? project.status}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
