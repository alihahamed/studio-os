import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ASSET_BUCKET = "project-assets";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.storage.getBucket(ASSET_BUCKET);
  if (data) return;

  const { error } = await supabase.storage.createBucket(ASSET_BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_SIZE,
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

async function signedDeliverables(
  supabase: ReturnType<typeof createAdminClient>,
  deliverables: Record<string, unknown>[]
) {
  return Promise.all(
    deliverables.map(async (deliverable) => {
      const storagePath = deliverable.storage_path as string | null;
      if (!storagePath) return { ...deliverable, download_url: null };

      const { data } = await supabase.storage
        .from(ASSET_BUCKET)
        .createSignedUrl(storagePath, 60 * 10);

      return { ...deliverable, download_url: data?.signedUrl ?? null };
    })
  );
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = new URL(req.url).searchParams.get("project_id");
  if (!projectId) {
    return Response.json({ error: "Missing project_id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("project_deliverables")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: "Failed to load deliverables" },
      { status: 500 }
    );
  }

  return Response.json({
    deliverables: await signedDeliverables(supabase, data ?? []),
  });
}

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form body" }, { status: 400 });
  }

  const projectId = formData.get("project_id");
  const title = formData.get("title");
  const description = formData.get("description");
  const url = formData.get("url");
  const file = formData.get("file");

  if (typeof projectId !== "string" || typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Project and title required" }, { status: 400 });
  }

  const hasUrl = typeof url === "string" && url.trim().length > 0;
  const hasFile = file instanceof File && file.size > 0;
  if (!hasUrl && !hasFile) {
    return Response.json(
      { error: "Add a file or external URL" },
      { status: 400 }
    );
  }

  if (hasFile && file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File exceeds 50MB limit" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("clerk_org_id", orgId)
    .single();

  const { data: project } = await supabase
    .from("projects")
    .select("id, agency_id")
    .eq("id", projectId)
    .eq("agency_id", agency?.id ?? "")
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  let storagePath: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let sizeBytes: number | null = null;

  if (hasFile) {
    await ensureBucket(supabase);
    fileName = safeFileName(file.name);
    mimeType = file.type;
    sizeBytes = file.size;
    storagePath = `${project.agency_id}/${project.id}/deliverables/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(ASSET_BUCKET)
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ error: "Failed to upload file" }, { status: 500 });
    }
  }

  const { data: deliverable, error } = await supabase
    .from("project_deliverables")
    .insert({
      project_id: project.id,
      title: title.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      url: hasUrl ? (url as string).trim() : null,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      created_by: profile?.id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (storagePath) await supabase.storage.from(ASSET_BUCKET).remove([storagePath]);
    return Response.json(
      { error: "Failed to record deliverable" },
      { status: 500 }
    );
  }

  return Response.json({ deliverable }, { status: 201 });
}
