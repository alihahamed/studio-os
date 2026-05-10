import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  clerk_org_id: z.string().min(1),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Get agency by clerk_org_id
  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .select("id")
    .eq("clerk_org_id", parsed.data.clerk_org_id)
    .single();

  if (agencyError || !agency) {
    return Response.json({ error: "Agency not found" }, { status: 404 });
  }

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      agency_id: agency.id,
      title: parsed.data.title,
      status: "draft",
    })
    .select("id, title, status")
    .single();

  if (projectError) {
    return Response.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }

  // Create empty proposal for this project
  await supabase.from("proposals").insert({
    project_id: project.id,
    markdown_content: "",
    base_price: 0,
    currency: "usd",
  });

  return Response.json({ project }, { status: 201 });
}
