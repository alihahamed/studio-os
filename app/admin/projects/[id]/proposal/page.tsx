"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

// Lazy-load markdown editor (heavy component)
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Addon {
  id?: string;
  label: string;
  description: string;
  price: number;
  sort_order: number;
}

export default function ProposalEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [markdown, setMarkdown] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [currency, setCurrency] = useState("usd");
  const [addons, setAddons] = useState<Addon[]>([]);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Load existing proposal
  const loadProposal = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.proposal) {
          setProposalId(data.proposal.id);
          setMarkdown(data.proposal.markdown_content || "");
          setBasePrice(data.proposal.base_price || 0);
          setCurrency(data.proposal.currency || "usd");
        }
        if (data.addons) {
          setAddons(data.addons);
        }
      }
    } catch {
      setError("Failed to load proposal");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  // Save proposal
  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/proposals/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: proposalId,
          markdown_content: markdown,
          base_price: basePrice,
          currency,
          addons,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      setProposalId(data.proposal.id);
      if (data.addons) setAddons(data.addons);
    } catch {
      setError("Failed to save proposal");
    } finally {
      setSaving(false);
    }
  }

  // Dispatch proposal
  async function handleDispatch() {
    if (!clientEmail.trim()) {
      setError("Client email is required to dispatch");
      return;
    }

    setDispatching(true);
    setError("");

    try {
      // Save first
      await handleSave();

      const res = await fetch("/api/proposals/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          client_email: clientEmail.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to dispatch");

      router.push(`/admin/projects/${projectId}`);
    } catch {
      setError("Failed to dispatch proposal");
    } finally {
      setDispatching(false);
    }
  }

  // Add addon
  function addAddon() {
    setAddons([
      ...addons,
      {
        label: "",
        description: "",
        price: 0,
        sort_order: addons.length,
      },
    ]);
  }

  // Remove addon
  function removeAddon(index: number) {
    setAddons(addons.filter((_, i) => i !== index));
  }

  // Update addon field
  function updateAddon(index: number, field: keyof Addon, value: string | number) {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };
    setAddons(updated);
  }

  // Total price
  const totalPrice = basePrice + addons.reduce((s, a) => s + (a.price || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-surface-400">Loading proposal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-surface-50">
          Proposal Editor
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-surface-700 px-4 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {dispatching ? "Sending..." : "Dispatch to Client"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Client Email */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <label className="mb-2 block text-sm font-medium text-surface-200">
          Client Email
        </label>
        <input
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="client@example.com"
          className="w-full rounded-lg border border-surface-700 bg-surface-850 px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none focus:border-brand-500"
        />
      </div>

      {/* Markdown Editor */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <label className="mb-3 block text-sm font-medium text-surface-200">
          Proposal Content
        </label>
        <div data-color-mode="dark">
          <MDEditor
            value={markdown}
            onChange={(val) => setMarkdown(val || "")}
            height={400}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <h3 className="mb-4 text-sm font-medium text-surface-200">Pricing</h3>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-surface-400">
              Base Price (cents)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-sm text-surface-100 outline-none focus:border-brand-500"
            />
            <p className="mt-1 text-xs text-surface-500">
              = {formatPrice(basePrice, currency)}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-surface-400">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-sm text-surface-100 outline-none focus:border-brand-500"
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>
          </div>
        </div>

        {/* Add-ons */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-surface-300">
              Optional Add-ons
            </h4>
            <button
              onClick={addAddon}
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              + Add Option
            </button>
          </div>

          {addons.map((addon, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-surface-700 bg-surface-850 p-4"
            >
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={addon.label}
                  onChange={(e) => updateAddon(i, "label", e.target.value)}
                  placeholder="e.g. GSAP Animations"
                  className="w-full rounded border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-surface-100 outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  value={addon.description}
                  onChange={(e) => updateAddon(i, "description", e.target.value)}
                  placeholder="Brief description..."
                  className="w-full rounded border border-surface-700 bg-surface-900 px-3 py-1.5 text-xs text-surface-300 outline-none focus:border-brand-500"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  value={addon.price}
                  onChange={(e) =>
                    updateAddon(i, "price", parseInt(e.target.value) || 0)
                  }
                  placeholder="Price (cents)"
                  className="w-full rounded border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-surface-100 outline-none focus:border-brand-500"
                />
                <p className="mt-0.5 text-xs text-surface-500">
                  {formatPrice(addon.price, currency)}
                </p>
              </div>
              <button
                onClick={() => removeAddon(i)}
                className="self-start text-surface-500 hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 flex items-center justify-between border-t border-surface-700 pt-4">
          <span className="text-sm font-medium text-surface-300">
            Total (all add-ons)
          </span>
          <span className="text-xl font-semibold text-surface-50">
            {formatPrice(totalPrice, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
