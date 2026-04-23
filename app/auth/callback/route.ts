import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PREVIEW_MODE } from "@/utils/preview-data";

/**
 * /auth/callback
 *
 * Supabase Auth redirects here after the user clicks a confirmation email
 * or magic link. We exchange the `code` for a session cookie, then forward
 * the user to the requested destination (or /dashboard by default).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  if (PREVIEW_MODE) {
    return NextResponse.redirect(`${appUrl}${next}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${appUrl}${next}`);
}
