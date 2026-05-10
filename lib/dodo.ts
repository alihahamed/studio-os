import DodoPayments from "dodopayments";

/**
 * DodoPayments client — server-side only.
 * Never import this in client components.
 */
export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: (process.env.DODO_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode",
});
