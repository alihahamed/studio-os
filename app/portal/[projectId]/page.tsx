import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { PortalProposalView } from "@/components/portal/proposal-view";
import { PaymentReturnHandler } from "@/components/portal/payment-return-handler";

export default async function PortalPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await props.params;
  const supabase = createAdminClient();

  // Fetch project with proposal and addons
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-surface-400">Project not found.</p>
      </div>
    );
  }

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("project_id", projectId)
    .single();

  const { data: addons } = await supabase
    .from("proposal_addons")
    .select("*")
    .eq("proposal_id", proposal?.id ?? "")
    .order("sort_order", { ascending: true });

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("project_id", projectId)
    .single();

  // Determine view based on project status
  if (contract || project.status === "signed" || project.status === "awaiting_deposit") {
    return (
      <div className="space-y-8">
        <PaymentReturnHandler projectId={projectId} />
        <div>
          <h1 className="text-3xl font-semibold text-surface-50">
            {project.title}
          </h1>
          <p className="mt-2 text-surface-400">
            Contract signed — {formatPrice(contract?.total_price ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-8 text-center">
          <p className="text-surface-300">
            {project.status === "awaiting_deposit"
              ? "Awaiting deposit payment. You will be redirected to the payment page."
              : "Thank you for signing. Your project is being processed."}
          </p>
          {project.status === "awaiting_deposit" && (
            <a
              href={`/portal/${projectId}/payment`}
              className="mt-4 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
            >
              Pay Deposit →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (project.status === "active" || project.status === "completed" || project.status === "maintenance") {
    return (
      <div className="space-y-8">
        <PaymentReturnHandler projectId={projectId} />
        <h1 className="text-3xl font-semibold text-surface-50">
          {project.title}
        </h1>
        <div className="grid gap-6 md:grid-cols-2">
          <a
            href={`/portal/${projectId}/workspace`}
            className="rounded-xl border border-surface-800 bg-surface-900 p-6 transition-colors hover:border-surface-700"
          >
            <h3 className="font-medium text-surface-100">Workspace</h3>
            <p className="mt-1 text-sm text-surface-400">
              Upload assets and view project status.
            </p>
          </a>
          {project.status === "completed" && (
            <a
              href={`/portal/${projectId}/deliverables`}
              className="rounded-xl border border-surface-800 bg-surface-900 p-6 transition-colors hover:border-surface-700"
            >
              <h3 className="font-medium text-surface-100">Deliverables</h3>
              <p className="mt-1 text-sm text-surface-400">
                Access your project deliverables.
              </p>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Default: show proposal for review
  return (
    <PortalProposalView
      project={project}
      proposal={proposal}
      addons={addons ?? []}
      projectId={projectId}
    />
  );
}
