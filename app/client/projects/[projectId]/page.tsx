import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";

const steps = [
  "proposal_sent",
  "awaiting_deposit",
  "active",
  "completed",
  "maintenance",
];

const labels: Record<string, string> = {
  proposal_sent: "Review",
  awaiting_deposit: "Deposit",
  active: "Workspace",
  completed: "Final Pay",
  maintenance: "Handoff",
};

const statusIndex: Record<string, number> = {
  draft: 0,
  proposal_sent: 0,
  signed: 1,
  awaiting_deposit: 1,
  active: 2,
  completed: 3,
  maintenance: 4,
};

export default async function ClientProjectPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await props.params;
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
  const { data: project } = await supabase
    .from("projects")
    .select("*, contracts(*), payments(*)")
    .eq("id", projectId)
    .eq("agency_id", agencyId ?? "")
    .single();

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-surface-400">Project not found.</p>
      </div>
    );
  }

  const contract = project.contracts?.[0];
  const depositPaid = project.payments?.some(
    (payment: { type: string; status: string }) =>
      payment.type === "deposit" && payment.status === "succeeded"
  );
  const finalPaid = project.payments?.some(
    (payment: { type: string; status: string }) =>
      payment.type === "final" && payment.status === "succeeded"
  );
  const activeIndex = statusIndex[project.status] ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/client/projects"
          className="text-sm text-surface-500 hover:text-surface-300"
        >
          Back to projects
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-surface-50">
          {project.title}
        </h1>
        <p className="mt-1 text-sm text-surface-400">
          Status: {project.status.replace("_", " ")}
        </p>
      </div>

      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <div className="flex flex-wrap gap-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                index <= activeIndex
                  ? "bg-brand-600 text-white"
                  : "bg-surface-800 text-surface-500"
              }`}
            >
              {labels[step]}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
          <p className="text-xs uppercase text-surface-500">Contract</p>
          <p className="mt-2 text-lg font-semibold">
            {contract ? formatPrice(contract.total_price) : "Pending"}
          </p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
          <p className="text-xs uppercase text-surface-500">Deposit</p>
          <p className="mt-2 text-lg font-semibold">
            {depositPaid ? "Paid" : "Due"}
          </p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
          <p className="text-xs uppercase text-surface-500">Final</p>
          <p className="mt-2 text-lg font-semibold">
            {finalPaid ? "Paid" : project.status === "completed" ? "Due" : "Locked"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href={`/portal/${project.id}`}
          className="rounded-xl border border-surface-800 bg-surface-900 p-6 hover:border-brand-500/50"
        >
          <h2 className="text-lg font-semibold">Project Room</h2>
          <p className="mt-2 text-sm text-surface-400">
            Proposal, payments, workspace, current action.
          </p>
        </Link>
        <Link
          href={`/portal/${project.id}/workspace`}
          className="rounded-xl border border-surface-800 bg-surface-900 p-6 hover:border-brand-500/50"
        >
          <h2 className="text-lg font-semibold">Workspace</h2>
          <p className="mt-2 text-sm text-surface-400">
            Upload files and references.
          </p>
        </Link>
        <Link
          href={`/portal/${project.id}/deliverables`}
          className="rounded-xl border border-surface-800 bg-surface-900 p-6 hover:border-brand-500/50"
        >
          <h2 className="text-lg font-semibold">Deliverables</h2>
          <p className="mt-2 text-sm text-surface-400">
            Final handoff links and files after final payment.
          </p>
        </Link>
      </div>
    </div>
  );
}
