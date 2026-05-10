import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const dispatchSchema = z.object({
  project_id: z.string().uuid(),
  client_email: z.string().email(),
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = dispatchSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { project_id, client_email } = parsed.data;

  // Get project
  const { data: project } = await supabase
    .from("projects")
    .select("*, agencies(*)")
    .eq("id", project_id)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Build portal URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const portalUrl = `${baseUrl}/portal/${project_id}`;

  // Send email via Resend
  try {
    await resend.emails.send({
      from: "Studio OS <onboarding@resend.dev>",
      to: client_email,
      subject: `Your project proposal is ready — ${project.title}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #111113; border-radius: 12px; padding: 40px; border: 1px solid #27272a;">
            <h1 style="color: #fafafa; font-size: 24px; font-weight: 600; margin: 0 0 8px;">
              Your custom project architecture is ready for review.
            </h1>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
              ${project.agencies?.name || "Your developer"} has prepared a detailed proposal for <strong style="color: #d4d4d8;">${project.title}</strong>. 
              Review the scope, customize your options, and approve when ready.
            </p>
            <a href="${portalUrl}" 
               style="display: inline-block; background: #4c6ef5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
              Review Proposal →
            </a>
            <p style="color: #52525b; font-size: 12px; margin-top: 32px;">
              This link will take you to your secure client portal.
            </p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send email:", emailError);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  // Update project status to proposal_sent
  await supabase
    .from("projects")
    .update({ status: "proposal_sent" })
    .eq("id", project_id);

  return Response.json({ success: true });
}
