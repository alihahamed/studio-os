import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const completeProjectSchema = z.object({
  project_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = completeProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();

  if (!agency) {
    return Response.json({ error: "Agency not found" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, status")
    .eq("id", parsed.data.project_id)
    .eq("agency_id", agency.id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.status !== "active") {
    return Response.json(
      { error: "Only active projects can be marked complete" },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: "completed" })
    .eq("id", project.id);

  if (error) {
    return Response.json(
      { error: "Failed to mark project complete" },
      { status: 500 }
    );
  }

  return Response.json({ status: "completed" });
}
