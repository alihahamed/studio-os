"use client";

import { useState, useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { formatPrice } from "@/lib/utils";

interface ProposalAddon {
  id: string;
  label: string;
  description: string | null;
  price: number;
  is_selected: boolean;
}

interface PortalProposalViewProps {
  project: { id: string; title: string; status: string };
  proposal: {
    id: string;
    markdown_content: string | null;
    base_price: number;
    currency: string;
  } | null;
  addons: ProposalAddon[];
  projectId: string;
}

export function PortalProposalView({
  project,
  proposal,
  addons: initialAddons,
  projectId,
}: PortalProposalViewProps) {
  const [addons, setAddons] = useState(initialAddons);
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Toggle addon selection
  function toggleAddon(id: string) {
    setAddons(
      addons.map((a) => (a.id === id ? { ...a, is_selected: !a.is_selected } : a))
    );
  }

  // Price calculation
  const basePrice = proposal?.base_price ?? 0;
  const addonsTotal = addons
    .filter((a) => a.is_selected)
    .reduce((sum, a) => sum + a.price, 0);
  const totalPrice = basePrice + addonsTotal;
  const currency = proposal?.currency ?? "usd";

  // Render markdown
  const htmlContent = proposal?.markdown_content
    ? DOMPurify.sanitize(marked.parse(proposal.markdown_content) as string)
    : "";

  // Canvas drawing
  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "#fafafa";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function endDraw() {
    isDrawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Submit signature
  async function handleSign() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL("image/png");

    // Check if canvas is empty
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = !imageData.data.some((channel, i) => i % 4 !== 3 ? false : channel !== 0);

    if (isEmpty) {
      setError("Please draw your signature before approving.");
      return;
    }

    setSigning(true);
    setError("");

    try {
      const res = await fetch("/api/contracts/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          selected_addon_ids: addons.filter((a) => a.is_selected).map((a) => a.id),
          signature_data: signatureData,
        }),
      });

      if (!res.ok) throw new Error("Failed to sign contract");

      // Reload page to show new state
      window.location.reload();
    } catch {
      setError("Failed to sign contract. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-surface-50">
          {project.title}
        </h1>
        <p className="mt-2 text-sm text-surface-400">
          Review your project proposal below.
        </p>
      </div>

      {/* Proposal Content */}
      {htmlContent && (
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-8">
          <div
            className="prose prose-invert max-w-none prose-headings:text-surface-50 prose-p:text-surface-300 prose-a:text-brand-400 prose-strong:text-surface-100 prose-code:text-brand-300"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      )}

      {/* Pricing Section */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-8">
        <h2 className="mb-6 text-xl font-semibold text-surface-50">
          Project Investment
        </h2>

        {/* Base Price */}
        <div className="flex items-center justify-between border-b border-surface-800 pb-4">
          <span className="text-surface-200">Core Architecture</span>
          <span className="font-medium text-surface-100">
            {formatPrice(basePrice, currency)}
          </span>
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-medium text-surface-400">
              Optional Enhancements
            </h3>
            {addons.map((addon) => (
              <label
                key={addon.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                  addon.is_selected
                    ? "border-brand-500/30 bg-brand-600/5"
                    : "border-surface-700 hover:border-surface-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={addon.is_selected}
                    onChange={() => toggleAddon(addon.id)}
                    className="h-4 w-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-surface-100">
                      {addon.label}
                    </p>
                    {addon.description && (
                      <p className="text-xs text-surface-500">
                        {addon.description}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-surface-200">
                  +{formatPrice(addon.price, currency)}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="mt-6 flex items-center justify-between border-t border-surface-800 pt-4">
          <span className="text-lg font-medium text-surface-200">Total</span>
          <span className="text-2xl font-bold text-surface-50">
            {formatPrice(totalPrice, currency)}
          </span>
        </div>
      </div>

      {/* Signature Section */}
      {!showSignature ? (
        <button
          onClick={() => setShowSignature(true)}
          className="w-full rounded-xl bg-brand-600 py-4 text-center text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Proceed to Sign →
        </button>
      ) : (
        <div className="rounded-xl border border-surface-800 bg-surface-900 p-8">
          <h2 className="mb-4 text-xl font-semibold text-surface-50">
            Sign Agreement
          </h2>
          <p className="mb-6 text-sm text-surface-400">
            By signing below, you agree to the scope and pricing outlined above.
          </p>

          {/* Canvas */}
          <div className="mb-4 rounded-lg border border-surface-700 bg-surface-950">
            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              className="w-full cursor-crosshair"
            />
          </div>

          <div className="mb-6 flex gap-3">
            <button
              onClick={clearSignature}
              className="text-sm text-surface-400 hover:text-surface-200"
            >
              Clear Signature
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            onClick={handleSign}
            disabled={signing}
            className="w-full rounded-lg bg-brand-600 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {signing ? "Processing..." : "Approve & Sign Contract"}
          </button>
        </div>
      )}
    </div>
  );
}
