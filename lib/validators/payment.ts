import { z } from "zod";

// ============================================================
// Payment Validators
// ============================================================

export const createPaymentSessionSchema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(["deposit", "final"]),
});

export type CreatePaymentSessionInput = z.infer<typeof createPaymentSessionSchema>;
