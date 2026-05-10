import { z } from "zod";

// ============================================================
// Proposal Validators
// ============================================================

export const createProposalSchema = z.object({
  project_id: z.string().uuid(),
  markdown_content: z.string().min(1, "Proposal content is required"),
  base_price: z.number().int().positive("Base price must be positive"),
  currency: z.string().length(3).default("usd"),
});

export const createAddonSchema = z.object({
  proposal_id: z.string().uuid(),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  price: z.number().int().positive("Price must be positive"),
  sort_order: z.number().int().default(0),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type CreateAddonInput = z.infer<typeof createAddonSchema>;
