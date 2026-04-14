import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("realtor_id", user.id)
    .eq("read", false);

  return NextResponse.json({ ok: true });
}
