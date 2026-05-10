import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const signSchema = z.object({
  project_id: z.string().uuid(),
  selected_addon_ids: z.array(z.string().uuid()),
  signature_data: z.string().min(1),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = signSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { project_id, selected_addon_ids, signature_data } = parsed.data;

  // Get proposal
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("project_id", project_id)
    .single();

  if (!proposal) {
    return Response.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Get addons
  const { data: allAddons } = await supabase
    .from("proposal_addons")
    .select("*")
    .eq("proposal_id", proposal.id);

  const selectedAddons = (allAddons ?? []).filter((a) =>
    selected_addon_ids.includes(a.id)
  );

  // Calculate total
  const totalPrice =
    proposal.base_price +
    selectedAddons.reduce((sum, a) => sum + a.price, 0);

  // Get signer IP from request headers
  const forwarded = req.headers.get("x-forwarded-for");
  const signerIp = forwarded?.split(",")[0]?.trim() || null;

  // Create contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      project_id,
      proposal_snapshot: {
        markdown_content: proposal.markdown_content,
        base_price: proposal.base_price,
        currency: proposal.currency,
      },
      selected_addons: selectedAddons,
      total_price: totalPrice,
      signature_data,
      signer_ip: signerIp,
    })
    .select("id")
    .single();

  if (contractError) {
    console.error("Contract creation failed:", contractError);
    return Response.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }

  // Update project status
  await supabase
    .from("projects")
    .update({ status: "awaiting_deposit" })
    .eq("id", project_id);

  // Mark selected addons
  if (selected_addon_ids.length > 0) {
    await supabase
      .from("proposal_addons")
      .update({ is_selected: true })
      .in("id", selected_addon_ids);
  }

  return Response.json({ contract_id: contract.id }, { status: 201 });
}
