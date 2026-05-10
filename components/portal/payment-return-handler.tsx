"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PaymentReturnHandler({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const payment = searchParams.get("payment");
    const status = searchParams.get("status");

    if ((payment !== "deposit" && payment !== "final") || status !== "success") {
      return;
    }

    let cancelled = false;

    async function confirmPayment() {
      setMessage("Confirming payment...");
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, type: payment }),
      });

      if (cancelled) return;

      if (res.ok) {
        router.replace(`/portal/${projectId}`);
        router.refresh();
        return;
      }

      setMessage("Payment received. Waiting for processor confirmation.");
    }

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [projectId, router, searchParams]);

  if (!message) return null;

  return (
    <div className="rounded-lg border border-brand-500/30 bg-brand-600/10 px-4 py-3 text-sm text-brand-200">
      {message}
    </div>
  );
}
