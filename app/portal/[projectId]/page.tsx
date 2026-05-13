import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { PortalProposalView } from "@/components/portal/proposal-view";
import { PaymentReturnHandler } from "@/components/portal/payment-return-handler";

const steps = [
  { key: "proposal_sent", label: "Review" },
  { key: "awaiting_deposit", label: "Deposit" },
  { key: "active", label: "Workspace" },
  { key: "completed", label: "Final Pay" },
  { key: "maintenance", label: "Handoff" },
];

const statusIndex: Record<string, number> = {
  draft: 0,
  proposal_sent: 0,
  signed: 1,
  awaiting_deposit: 1,
  active: 2,
  completed: 3,
  maintenance: 4,
};

function ProjectTimeline({ status }: { status: string }) {
  const activeIndex = statusIndex[status] ?? 0;

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                index <= activeIndex
                  ? "bg-brand-600 text-white"
                  : "bg-surface-800 text-surface-500"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={
                index <= activeIndex
                  ? "text-sm text-surface-100"
                  : "text-sm text-surface-500"
              }
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`hidden h-px w-8 sm:block ${
                  index < activeIndex ? "bg-brand-600" : "bg-surface-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-surface-800 bg-surface-900 p-6 transition-colors hover:border-brand-500/50"
    >
      <h2 className="text-lg font-semibold text-surface-50">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-surface-400">{body}</p>
      <p className="mt-5 text-sm font-medium text-brand-400">{label}</p>
    </Link>
  );
}

export default async function PortalPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await props.params;
  const supabase = createAdminClient();

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

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const depositPaid = payments?.some(
    (payment) => payment.type === "deposit" && payment.status === "succeeded"
  );
  const finalPaid = payments?.some(
    (payment) => payment.type === "final" && payment.status === "succeeded"
  );

  if (project.status === "draft" || project.status === "proposal_sent") {
    return (
      <PortalProposalView
        project={project}
        proposal={proposal}
        addons={addons ?? []}
        projectId={projectId}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PaymentReturnHandler projectId={projectId} />

      <div>
        <p className="text-sm font-medium text-brand-400">Client Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-surface-50">
          {project.title}
        </h1>
        <p className="mt-2 text-sm text-surface-400">
          {contract
            ? `Contract value ${formatPrice(contract.total_price)}`
            : "Project room"}
        </p>
      </div>

      <ProjectTimeline status={project.status} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
          <p className="text-xs uppercase tracking-wide text-surface-500">
            Contract
          </p>
          <p className="mt-2 text-lg font-semibold text-surface-50">
            {contract ? "Signed" : "Pending"}
          </p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
          <p className="text-xs uppercase tracking-wide text-surface-500">
            Deposit
          </p>
          <p className="mt-2 text-lg font-semibold text-surface-50">
            {depositPaid ? "Paid" : "Due"}
          </p>
        </div>
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-5">
          <p className="text-xs uppercase tracking-wide text-surface-500">
            Final
          </p>
          <p className="mt-2 text-lg font-semibold text-surface-50">
            {finalPaid ? "Paid" : project.status === "completed" ? "Due" : "Locked"}
          </p>
        </div>
      </div>

      {project.status === "signed" || project.status === "awaiting_deposit" ? (
        <ActionCard
          title="Deposit Payment"
          body="Deposit starts active project work and unlocks workspace access."
          href={`/portal/${projectId}/payment`}
          label="Pay deposit"
        />
      ) : null}

      {project.status === "active" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ActionCard
            title="Workspace"
            body="Upload assets, briefs, brand files, references, credentials, and documents."
            href={`/portal/${projectId}/workspace`}
            label="Open workspace"
          />
          <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
            <h2 className="text-lg font-semibold text-surface-50">
              Current Stage
            </h2>
            <p className="mt-2 text-sm leading-6 text-surface-400">
              Project active. Your developer can review uploaded files and move
              project toward handoff.
            </p>
          </div>
        </div>
      ) : null}

      {project.status === "completed" ? (
        <ActionCard
          title="Final Payment"
          body="Final payment unlocks completed project files and handoff assets."
          href={`/portal/${projectId}/payment?type=final`}
          label="Pay final balance"
        />
      ) : null}

      {project.status === "maintenance" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ActionCard
            title="Deliverables"
            body="Download final assets, documents, and handoff files."
            href={`/portal/${projectId}/deliverables`}
            label="Open deliverables"
          />
          <ActionCard
            title="Workspace"
            body="Keep project reference files and shared assets available."
            href={`/portal/${projectId}/workspace`}
            label="Open workspace"
          />
        </div>
      ) : null}
    </div>
  );
}
