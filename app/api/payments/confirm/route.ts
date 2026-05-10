import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dodo } from "@/lib/dodo";
import { z } from "zod";

const confirmPaymentSchema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(["deposit", "final"]),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = confirmPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { project_id, type } = parsed.data;
  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, project_id, type, status, dodo_payment_id")
    .eq("project_id", project_id)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!payment) {
    return Response.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "succeeded") {
    return Response.json({ status: "succeeded" });
  }

  if (!payment.dodo_payment_id) {
    return Response.json(
      { error: "Missing Dodo payment id" },
      { status: 409 }
    );
  }

  const dodoPayment = await dodo.payments.retrieve(payment.dodo_payment_id);
  if (dodoPayment.status !== "succeeded") {
    return Response.json(
      { status: dodoPayment.status ?? "pending" },
      { status: 202 }
    );
  }

  await supabase
    .from("payments")
    .update({ status: "succeeded" })
    .eq("id", payment.id);

  const newStatus = payment.type === "deposit" ? "active" : "maintenance";
  await supabase
    .from("projects")
    .update({ status: newStatus })
    .eq("id", payment.project_id);

  return Response.json({ status: "succeeded", project_status: newStatus });
}
