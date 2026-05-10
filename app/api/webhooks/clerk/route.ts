import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Clerk Webhook Handler
 * Syncs Clerk users and organizations to Supabase profiles/agencies tables.
 * Uses svix for signature verification.
 */
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createAdminClient();
  const eventType = evt.type;

  // user.created -> upsert profile
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address ?? null;
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

    const { error } = await supabase.from("profiles").upsert(
      {
        clerk_user_id: id,
        role: "admin",
        display_name: displayName,
        email: primaryEmail,
        avatar_url: image_url ?? null,
      },
      { onConflict: "clerk_user_id" }
    );

    if (error) {
      console.error("Failed to sync user to profiles:", error);
      return new Response("DB error", { status: 500 });
    }
  }

  // organization.created -> upsert agency + link owner profile when available
  if (eventType === "organization.created") {
    const { id, name, created_by } = evt.data;

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", created_by)
      .single();

    const { data: agency, error } = await supabase
      .from("agencies")
      .upsert(
        {
          clerk_org_id: id,
          name,
          owner_id: ownerProfile?.id ?? null,
        },
        { onConflict: "clerk_org_id" }
      )
      .select("id")
      .single();

    if (error) {
      console.error("Failed to sync org to agencies:", error);
      return new Response("DB error", { status: 500 });
    }

    if (ownerProfile && agency) {
      await supabase
        .from("profiles")
        .update({ agency_id: agency.id, clerk_org_id: id })
        .eq("id", ownerProfile.id);
    }
  }

  // organizationMembership.created -> upsert client profile and link to agency
  if (eventType === "organizationMembership.created") {
    const { organization, public_user_data } = evt.data;
    const clerkUserId = public_user_data?.user_id;

    if (clerkUserId) {
      let { data: agency } = await supabase
        .from("agencies")
        .select("id")
        .eq("clerk_org_id", organization.id)
        .single();

      if (!agency) {
        const { data: createdAgency } = await supabase
          .from("agencies")
          .upsert(
            {
              clerk_org_id: organization.id,
              name: organization.name ?? "Untitled Agency",
            },
            { onConflict: "clerk_org_id" }
          )
          .select("id")
          .single();
        agency = createdAgency ?? null;
      }

      if (agency) {
        const { error } = await supabase.from("profiles").upsert(
          {
            clerk_user_id: clerkUserId,
            clerk_org_id: organization.id,
            role: "client",
            agency_id: agency.id,
            email: public_user_data?.identifier ?? null,
          },
          { onConflict: "clerk_user_id" }
        );

        if (error) {
          console.error("Failed to sync org membership to profiles:", error);
          return new Response("DB error", { status: 500 });
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
