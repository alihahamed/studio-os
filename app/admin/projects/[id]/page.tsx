import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default async function ProjectDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { orgId } = await auth();
  const supabase = await createClient();

  // Get agency
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();

  // Get project with related data
  const { data: project } = await supabase
    .from("projects")
    .select("*, proposals(*), contracts(*), payments(*), assets(*)")
    .eq("id", id)
    .eq("agency_id", agency?.id ?? "")
    .single();

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-surface-400">Project not found.</p>
      </div>
    );
  }

  const proposal = project.proposals?.[0];
  const contract = project.contracts?.[0];
  const payments = project.payments ?? [];
  const assets = project.assets ?? [];

  const statusSteps = [
    "draft",
    "proposal_sent",
    "signed",
    "awaiting_deposit",
    "active",
    "completed",
    "maintenance",
  ];
  const currentStepIndex = statusSteps.indexOf(project.status);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/projects"
            className="mb-2 inline-block text-sm text-surface-500 hover:text-surface-300"
          >
            ← Back to Projects
          </Link>
          <h1 className="text-2xl font-semibold text-surface-50">
            {project.title}
          </h1>
          <p className="mt-1 text-sm text-surface-400">
            Status: {project.status.replace("_", " ")}
          </p>
        </div>
        <Link
          href={`/admin/projects/${id}/proposal`}
          className="rounded-lg border border-surface-700 px-4 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-800"
        >
          Edit Proposal
        </Link>
      </div>

      {/* Status Progress */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <h2 className="mb-4 text-sm font-medium text-surface-300">
          Project Lifecycle
        </h2>
        <div className="flex items-center gap-2">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  i <= currentStepIndex
                    ? "bg-brand-600 text-white"
                    : "bg-surface-800 text-surface-500"
                }`}
              >
                {i + 1}
              </div>
              {i < statusSteps.length - 1 && (
                <div
                  className={`h-0.5 w-6 ${
                    i < currentStepIndex ? "bg-brand-600" : "bg-surface-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {statusSteps.map((step) => (
            <span
              key={step}
              className="w-8 text-center text-[9px] text-surface-500"
            >
              {step.replace("_", " ").slice(0, 5)}
            </span>
          ))}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Contract Info */}
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <h3 className="mb-3 text-sm font-medium text-surface-300">
            Contract
          </h3>
          {contract ? (
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-surface-50">
                {formatPrice(contract.total_price)}
              </p>
              <p className="text-xs text-surface-500">
                Signed {new Date(contract.signed_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-surface-500">No contract yet.</p>
          )}
        </div>

        {/* Payments */}
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <h3 className="mb-3 text-sm font-medium text-surface-300">
            Payments
          </h3>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map(
                (pay: {
                  id: string;
                  type: string;
                  amount: number;
                  status: string;
                }) => (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize text-surface-200">
                      {pay.type}
                    </span>
                    <span
                      className={
                        pay.status === "succeeded"
                          ? "text-success"
                          : "text-surface-400"
                      }
                    >
                      {formatPrice(pay.amount)} — {pay.status}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-500">No payments yet.</p>
          )}
        </div>

        {/* Proposal */}
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <h3 className="mb-3 text-sm font-medium text-surface-300">
            Proposal
          </h3>
          {proposal ? (
            <div className="space-y-2">
              <p className="text-sm text-surface-200">
                Base price: {formatPrice(proposal.base_price)}
              </p>
              <p className="text-xs text-surface-500">
                {proposal.markdown_content
                  ? `${proposal.markdown_content.slice(0, 100)}...`
                  : "No content yet"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-surface-500">No proposal created.</p>
          )}
        </div>

        {/* Assets */}
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
          <h3 className="mb-3 text-sm font-medium text-surface-300">
            Assets ({assets.length})
          </h3>
          {assets.length > 0 ? (
            <div className="space-y-1">
              {assets
                .slice(0, 5)
                .map((asset: { id: string; file_name: string }) => (
                  <p
                    key={asset.id}
                    className="truncate text-sm text-surface-200"
                  >
                    {asset.file_name}
                  </p>
                ))}
            </div>
          ) : (
            <p className="text-sm text-surface-500">No assets uploaded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
