import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PREVIEW_MODE } from "@/utils/preview-data";

export async function PATCH(req: Request) {
  if (PREVIEW_MODE) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    full_name?: string;
    license_number?: string;
    brokerage?: string;
    phone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = body.full_name?.trim();
  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 422 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      license_number: body.license_number?.trim() || null,
      brokerage: body.brokerage?.trim() || null,
      phone: body.phone?.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("profile update error:", error);
    return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
