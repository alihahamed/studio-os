import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("project_id", projectId)
    .single();

  const { data: addons } = await supabase
    .from("proposal_addons")
    .select("*")
    .eq("proposal_id", proposal?.id ?? "")
    .order("sort_order", { ascending: true });

  return Response.json({ proposal, addons: addons ?? [] });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;
  const body = await req.json();
  const supabase = createAdminClient();

  // Upsert proposal
  let proposalId = body.proposal_id;

  if (proposalId) {
    await supabase
      .from("proposals")
      .update({
        markdown_content: body.markdown_content,
        base_price: body.base_price,
        currency: body.currency,
      })
      .eq("id", proposalId);
  } else {
    const { data: newProposal } = await supabase
      .from("proposals")
      .insert({
        project_id: projectId,
        markdown_content: body.markdown_content,
        base_price: body.base_price,
        currency: body.currency,
      })
      .select("id")
      .single();
    proposalId = newProposal?.id;
  }

  // Sync addons: delete existing, insert new
  if (proposalId && body.addons) {
    await supabase
      .from("proposal_addons")
      .delete()
      .eq("proposal_id", proposalId);

    if (body.addons.length > 0) {
      await supabase.from("proposal_addons").insert(
        body.addons.map(
          (
            addon: {
              label: string;
              description: string;
              price: number;
              sort_order: number;
            },
            i: number
          ) => ({
            proposal_id: proposalId,
            label: addon.label,
            description: addon.description,
            price: addon.price,
            sort_order: addon.sort_order ?? i,
          })
        )
      );
    }
  }

  // Get updated data
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  const { data: addons } = await supabase
    .from("proposal_addons")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("sort_order", { ascending: true });

  return Response.json({ proposal, addons });
}
