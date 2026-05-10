import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const { orgId } = await auth();

  const supabase = await createClient();

  // Fetch agency
  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("clerk_org_id", orgId)
    .single();

  // Fetch projects for this agency
  const { data: projects } = await supabase
    .from("projects")
    .select("*, payments(*)")
    .eq("agency_id", agency?.id ?? "")
    .order("created_at", { ascending: false });

  // Stats
  const totalProjects = projects?.length ?? 0;
  const activeProjects =
    projects?.filter((p) => p.status === "active").length ?? 0;
  const totalRevenue =
    projects?.reduce((sum, p) => {
      const paid =
        p.payments
          ?.filter((pay: { status: string }) => pay.status === "succeeded")
          ?.reduce(
            (s: number, pay: { amount: number }) => s + (pay.amount || 0),
            0
          ) ?? 0;
      return sum + paid;
    }, 0) ?? 0;

  const stats = [
    { label: "Total Projects", value: totalProjects },
    { label: "Active", value: activeProjects },
    {
      label: "Revenue",
      value: `$${(totalRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-50">Dashboard</h1>
          <p className="mt-1 text-sm text-surface-400">
            Welcome back{agency?.name ? `, ${agency.name}` : ""}.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          + New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-surface-800 bg-surface-900 p-6"
          >
            <p className="text-sm text-surface-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-surface-50">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-surface-50">
          Recent Projects
        </h2>
        {!projects || projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-surface-700 p-12 text-center">
            <p className="text-surface-400">No projects yet.</p>
            <Link
              href="/admin/projects/new"
              className="mt-3 inline-block text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              Create your first project →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="flex items-center justify-between rounded-xl border border-surface-800 bg-surface-900 p-4 transition-colors hover:border-surface-700 hover:bg-surface-850"
              >
                <div>
                  <p className="font-medium text-surface-100">
                    {project.title}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-500">
                    Created{" "}
                    {new Date(project.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    project.status === "active"
                      ? "bg-success/10 text-success"
                      : project.status === "draft"
                        ? "bg-surface-700 text-surface-300"
                        : project.status === "completed"
                          ? "bg-brand-600/10 text-brand-400"
                          : "bg-warning/10 text-warning"
                  }`}
                >
                  {project.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
