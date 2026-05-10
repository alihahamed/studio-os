import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ASSET_BUCKET = "project-assets";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ["image/", "font/"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "image/svg+xml",
  "text/plain",
];

function isAllowedMimeType(type: string) {
  return (
    ALLOWED_MIME_TYPES.includes(type) ||
    ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))
  );
}

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

  const { data: assets, error } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Failed to load assets" }, { status: 500 });
  }

  const assetsWithUrls = await Promise.all(
    (assets ?? []).map(async (asset) => {
      const { data } = await supabase.storage
        .from(ASSET_BUCKET)
        .createSignedUrl(asset.storage_path, 60 * 10);

      return {
        ...asset,
        download_url: data?.signedUrl ?? null,
      };
    })
  );

  return Response.json({ assets: assetsWithUrls });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      { error: "Upload body could not be parsed. Try a smaller file." },
      { status: 400 }
    );
  }
  const projectId = formData.get("project_id");
  const file = formData.get("file");

  if (typeof projectId !== "string" || !(file instanceof File)) {
    return Response.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File exceeds 50MB limit" }, { status: 400 });
  }

  if (!isAllowedMimeType(file.type)) {
    return Response.json({ error: "File type is not allowed" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, agency_id, status")
    .eq("id", projectId)
    .single();

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!["active", "completed", "maintenance"].includes(project.status)) {
    return Response.json(
      { error: "Asset uploads unlock after deposit payment" },
      { status: 409 }
    );
  }

  await ensureBucket(supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  const fileName = safeFileName(file.name);
  const storagePath = `${project.agency_id}/${project.id}/${Date.now()}-${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }

  const { data: asset, error: insertError } = await supabase
    .from("assets")
    .insert({
      project_id: project.id,
      uploaded_by: profile?.id ?? null,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select("*")
    .single();

  if (insertError) {
    await supabase.storage.from(ASSET_BUCKET).remove([storagePath]);
    return Response.json({ error: "Failed to record asset" }, { status: 500 });
  }

  return Response.json({ asset }, { status: 201 });
}
