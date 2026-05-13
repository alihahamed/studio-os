import { PaymentCheckout } from "@/components/portal/payment-checkout";

export default async function PaymentPage(props: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { projectId } = await props.params;
  const { type } = await props.searchParams;
  const paymentType = type === "final" ? "final" : "deposit";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-surface-50">
        Complete Payment
      </h1>
      <p className="text-sm text-surface-400">
        {paymentType === "final"
          ? "Final payment unlocks project deliverables."
          : "A 50% deposit is required to begin."}
      </p>
      <PaymentCheckout projectId={projectId} paymentType={paymentType} />
    </div>
  );
}
