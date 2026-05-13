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

async function getClientProjects() {
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
  if (!agencyId) return [];

  const { data } = await supabase
    .from("projects")
    .select("id, title, status, updated_at")
    .eq("agency_id", agencyId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export default async function ClientDashboard() {
  const projects = await getClientProjects();
  const activeCount = projects.filter((project) => project.status === "active").length;
  const actionCount = projects.filter((project) =>
    ["proposal_sent", "awaiting_deposit", "completed"].includes(project.status)
  ).length;
  const latestProjects = projects.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-50">
            Client Dashboard
          </h1>
          <p className="mt-1 text-sm text-surface-400">
            Project rooms, payments, workspace, deliverables.
          </p>
        </div>
        <Link
          href="/client/projects"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          View Projects
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <p className="text-sm text-surface-400">Projects</p>
          <p className="mt-2 text-3xl font-semibold">{projects.length}</p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <p className="text-sm text-surface-400">Active</p>
          <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <p className="text-sm text-surface-400">Needs Action</p>
          <p className="mt-2 text-3xl font-semibold">{actionCount}</p>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-surface-50">
            Recent Projects
          </h2>
          <Link
            href="/client/projects"
            className="text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            All projects
          </Link>
        </div>

        {latestProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-surface-700 p-12 text-center">
            <p className="text-surface-400">No client projects linked yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {latestProjects.map((project) => (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
                className="rounded-xl border border-surface-800 bg-surface-900 p-6 transition-colors hover:border-brand-500/50"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
                  {statusText[project.status] ?? project.status}
                </p>
                <h3 className="mt-3 truncate text-xl font-semibold">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm text-surface-500">
                  Updated {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
