import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dodo } from "@/lib/dodo";
import { z } from "zod";

const createSessionSchema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(["deposit", "final"]),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { project_id, type } = parsed.data;

  // Get contract for total price
  const { data: contract } = await supabase
    .from("contracts")
    .select("total_price")
    .eq("project_id", project_id)
    .single();

  if (!contract) {
    return Response.json({ error: "Contract not found" }, { status: 404 });
  }

  // Calculate amount (50% deposit or remaining 50%)
  const amount = Math.floor(contract.total_price / 2);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // Create DodoPayments checkout session
    const session = await dodo.payments.create({
      billing: {
        city: "N/A",
        country: "US",
        state: "N/A",
        street: "N/A",
        zipcode: "00000",
      },
      customer: {
        email: "client@example.com", // Will be enhanced with actual client email
        name: "Client",
      },
      payment_link: true,
      product_cart: [
        {
          product_id: process.env.DODO_PRODUCT_ID || "prod_placeholder",
          quantity: 1,
        },
      ],
      return_url: `${baseUrl}/portal/${project_id}?payment=${type}&status=success`,
    });

    // Record payment in DB
    await supabase.from("payments").insert({
      project_id,
      dodo_payment_id: session.payment_id || null,
      amount,
      currency: "usd",
      type,
      status: "pending",
    });

    return Response.json({
      checkout_url: session.payment_link,
    });
  } catch (err) {
    console.error("DodoPayments error:", err);
    return Response.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
