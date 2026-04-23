import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PREVIEW_MODE } from "@/utils/preview-data";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per photo

/**
 * POST /api/intake/[token]/upload
 * Accepts multipart/form-data with one `file` field.
 * Stores under listing-assets/<listing_id>/<uuid>.<ext> and inserts a
 * listing_assets row marked uploaded_by: 'homeowner'.
 *
 * Unauthenticated — the intake token IS the auth.
 */
export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  if (PREVIEW_MODE) {
    return NextResponse.json({ ok: true, storage_path: "preview/photo.jpg" });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, or HEIC." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is too large. Max 15 MB per photo." },
      { status: 413 }
    );
  }

  const supabase = createAdminClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, intake_completed_at")
    .eq("intake_token", token)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  if (listing.intake_completed_at) {
    return NextResponse.json(
      { error: "This intake has already been submitted." },
      { status: 409 }
    );
  }

  // Extension
  const ext =
    file.type === "image/jpeg" ? "jpg"
    : file.type === "image/png"  ? "png"
    : file.type === "image/webp" ? "webp"
    : file.type === "image/heic" ? "heic"
    : "bin";

  const storagePath = `${listing.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("listing-assets")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("storage upload error:", uploadError);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  // Next sort_order = current max + 1
  const { data: existing } = await supabase
    .from("listing_assets")
    .select("sort_order")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error: insertError } = await supabase.from("listing_assets").insert({
    listing_id: listing.id,
    storage_path: storagePath,
    asset_type: "photo",
    sort_order: nextOrder,
    uploaded_by: "homeowner",
  });

  if (insertError) {
    console.error("listing_assets insert error:", insertError);
    // Best-effort cleanup of the orphaned upload
    await supabase.storage.from("listing-assets").remove([storagePath]);
    return NextResponse.json({ error: "Could not record photo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, storage_path: storagePath });
}
