"use client";

import { useState } from "react";

export function PaymentCheckout({
  projectId,
  paymentType,
}: {
  projectId: string;
  paymentType: "deposit" | "final";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, type: paymentType }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch {
      setError("Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-8 text-center">
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <button
        onClick={handlePay}
        disabled={loading}
        className="rounded-lg bg-brand-600 px-8 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading
          ? "Redirecting..."
          : paymentType === "final"
            ? "Pay Final Balance"
            : "Pay Deposit"}
      </button>
    </div>
  );
}
