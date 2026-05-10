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

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get raw body
  const body = await req.text();

  // Verify signature
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

  // Handle user creation — sync to profiles table
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address ?? null;
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

    const { error } = await supabase.from("profiles").insert({
      clerk_user_id: id,
      role: "admin", // Default new users to admin; clients are created via invitation
      display_name: displayName,
      email: primaryEmail,
      avatar_url: image_url ?? null,
    });

    if (error) {
      console.error("Failed to sync user to profiles:", error);
      return new Response("DB error", { status: 500 });
    }
  }

  // Handle organization creation — sync to agencies table
  if (eventType === "organization.created") {
    const { id, name, created_by } = evt.data;

    // Find the creator's profile
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", created_by)
      .single();

    const { data: agency, error } = await supabase
      .from("agencies")
      .insert({
        clerk_org_id: id,
        name: name,
        owner_id: ownerProfile?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to sync org to agencies:", error);
      return new Response("DB error", { status: 500 });
    }

    // Link the owner's profile to this agency
    if (ownerProfile && agency) {
      await supabase
        .from("profiles")
        .update({ agency_id: agency.id, clerk_org_id: id })
        .eq("id", ownerProfile.id);
    }
  }

  // Handle organization membership — sync client profiles
  if (eventType === "organizationMembership.created") {
    const { organization, public_user_data } = evt.data;
    const clerkUserId = public_user_data?.user_id;

    if (clerkUserId) {
      // Get the agency
      const { data: agency } = await supabase
        .from("agencies")
        .select("id")
        .eq("clerk_org_id", organization.id)
        .single();

      if (agency) {
        // Update existing profile or it's a new client
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("clerk_user_id", clerkUserId)
          .single();

        if (existingProfile) {
          await supabase
            .from("profiles")
            .update({
              agency_id: agency.id,
              clerk_org_id: organization.id,
            })
            .eq("id", existingProfile.id);
        } else {
          // New client being added via invitation
          await supabase.from("profiles").insert({
            clerk_user_id: clerkUserId,
            clerk_org_id: organization.id,
            role: "client",
            agency_id: agency.id,
            email: public_user_data?.identifier ?? null,
          });
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
