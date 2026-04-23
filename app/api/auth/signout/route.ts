import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PREVIEW_MODE } from "@/utils/preview-data";

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  if (!PREVIEW_MODE) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true, redirect: `${appUrl}/login` });
}
