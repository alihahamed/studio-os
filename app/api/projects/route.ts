import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  clerk_org_id: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return Response.json(
      { code: "UNAUTHORIZED", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        code: "INVALID_INPUT",
        message: "Invalid input",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const effectiveOrgId = orgId ?? parsed.data.clerk_org_id;
  if (!effectiveOrgId) {
    return Response.json(
      {
        code: "ORG_REQUIRED",
        message: "No active organization selected",
        hint: "Create/select organization, then retry.",
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: existingAgency } = await supabase
    .from("agencies")
    .select("id")
    .eq("clerk_org_id", effectiveOrgId)
    .single();

  let agency = existingAgency;

  if (!agency) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({
        organizationId: effectiveOrgId,
      });

      const { data: createdAgency, error: upsertAgencyError } = await supabase
        .from("agencies")
        .upsert(
          {
            clerk_org_id: effectiveOrgId,
            name: org.name ?? "Untitled Agency",
          },
          { onConflict: "clerk_org_id" }
        )
        .select("id")
        .single();

      if (upsertAgencyError || !createdAgency) {
        return Response.json(
          {
            code: "AGENCY_PROVISION_FAILED",
            message: "Failed to provision agency",
          },
          { status: 500 }
        );
      }

      agency = createdAgency;
    } catch {
      return Response.json(
        {
          code: "ORG_NOT_SYNCED",
          message: "Organization not synced yet",
          hint: "Wait a few seconds and retry project creation.",
        },
        { status: 409 }
      );
    }
  }

  // Keep caller profile aligned so RLS-protected admin reads can find agency-scoped data.
  await supabase
    .from("profiles")
    .update({ agency_id: agency.id, clerk_org_id: effectiveOrgId })
    .eq("clerk_user_id", userId);

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
      { code: "PROJECT_CREATE_FAILED", message: "Failed to create project" },
      { status: 500 }
    );
  }

  const { error: proposalError } = await supabase.from("proposals").insert({
    project_id: project.id,
    markdown_content: "",
    base_price: 0,
    currency: "usd",
  });

  if (proposalError) {
    await supabase.from("projects").delete().eq("id", project.id);
    return Response.json(
      {
        code: "PROPOSAL_BOOTSTRAP_FAILED",
        message: "Failed to initialize project proposal",
      },
      { status: 500 }
    );
  }

  return Response.json({ project }, { status: 201 });
}
