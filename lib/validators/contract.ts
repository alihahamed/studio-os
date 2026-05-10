import { z } from "zod";

// ============================================================
// Contract Validators
// ============================================================

export const signContractSchema = z.object({
  project_id: z.string().uuid(),
  selected_addon_ids: z.array(z.string().uuid()),
  signature_data: z.string().min(1, "Signature is required"),
});

export type SignContractInput = z.infer<typeof signContractSchema>;
