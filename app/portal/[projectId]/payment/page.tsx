"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function PaymentPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, type: "deposit" }),
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
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-surface-50">Complete Payment</h1>
      <p className="text-sm text-surface-400">A 50% deposit is required to begin.</p>
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-8 text-center">
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}
        <button onClick={handlePay} disabled={loading}
          className="rounded-lg bg-brand-600 px-8 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Redirecting..." : "Pay Deposit →"}
        </button>
      </div>
    </div>
  );
}
