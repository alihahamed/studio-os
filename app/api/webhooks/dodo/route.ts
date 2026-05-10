import { Webhook } from "standardwebhooks";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DodoPayments Webhook Handler
 * Processes payment events and updates project status accordingly.
 * Uses Standard Webhooks spec for signature verification.
 */
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Missing DODO_WEBHOOK_SECRET", { status: 500 });
  }

  // Get raw body before any parsing
  const body = await req.text();

  // Extract Standard Webhook headers
  const webhookId = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return new Response("Missing webhook headers", { status: 400 });
  }

  // Replay protection: reject events older than 5 minutes
  const timestamp = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return new Response("Timestamp too old", { status: 400 });
  }

  // Verify signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let payload: Record<string, unknown>;

  try {
    payload = wh.verify(body, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    }) as Record<string, unknown>;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency check — skip if already processed
  const { data: existing } = await supabase
    .from("dodo_events")
    .select("webhook_id")
    .eq("webhook_id", webhookId)
    .single();

  if (existing) {
    return new Response("Already processed", { status: 200 });
  }

  // Record the event for dedup
  const eventType = (payload.event_type as string) || "unknown";
  const payloadType = (payload.payload_type as string) || null;

  await supabase.from("dodo_events").insert({
    webhook_id: webhookId,
    event_type: eventType,
    payload_type: payloadType,
  });

  // Handle payment.succeeded
  if (eventType === "payment.succeeded") {
    const paymentData = payload.data as Record<string, unknown> | undefined;

    if (paymentData) {
      const dodoPaymentId = paymentData.payment_id as string | undefined;

      // Find the matching payment record
      if (dodoPaymentId) {
        const { data: payment } = await supabase
          .from("payments")
          .select("id, project_id, type")
          .eq("dodo_payment_id", dodoPaymentId)
          .single();

        if (payment) {
          // Update payment status
          await supabase
            .from("payments")
            .update({ status: "succeeded" })
            .eq("id", payment.id);

          // Update project status based on payment type
          const newStatus =
            payment.type === "deposit" ? "active" : "maintenance";

          await supabase
            .from("projects")
            .update({ status: newStatus })
            .eq("id", payment.project_id);
        }
      }
    }
  }

  // Handle payment.failed
  if (eventType === "payment.failed") {
    const paymentData = payload.data as Record<string, unknown> | undefined;
    const dodoPaymentId = paymentData?.payment_id as string | undefined;

    if (dodoPaymentId) {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("dodo_payment_id", dodoPaymentId);
    }
  }

  return new Response("OK", { status: 200 });
}
