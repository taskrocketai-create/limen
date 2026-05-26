import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform, caption, imageUrl, listingId } = await request.json();

  // Get Meta connection
  const supabaseAdmin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conn } = await (supabaseAdmin as any)
    .from("meta_connections")
    .select("*")
    .eq("realtor_id", user.id)
    .single();

  if (!conn) {
    return NextResponse.json({ error: "Meta account not connected. Connect in Settings." }, { status: 400 });
  }

  // Check token expiry
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "Meta connection expired. Reconnect in Settings." }, { status: 400 });
  }

  try {
    if (platform === "facebook") {
      if (!conn.facebook_page_id || !conn.facebook_page_token) {
        return NextResponse.json({ error: "No Facebook Page connected." }, { status: 400 });
      }

      // Upload photo to Facebook
      const uploadRes = await fetch(
        `https://graph.facebook.com/v19.0/${conn.facebook_page_id}/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrl,
            caption,
            published: true,
            access_token: conn.facebook_page_token,
          }),
        }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.error) {
        return NextResponse.json({ error: uploadData.error.message }, { status: 400 });
      }

      const postUrl = `https://www.facebook.com/${conn.facebook_page_id}/posts/${uploadData.post_id ?? uploadData.id}`;
      return NextResponse.json({ success: true, postUrl, platform: "facebook" });
    }

    if (platform === "instagram") {
      if (!conn.instagram_account_id || !conn.facebook_page_token) {
        return NextResponse.json({ error: "No Instagram Business account connected." }, { status: 400 });
      }

      // Step 1: Create media container
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${conn.instagram_account_id}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            caption,
            access_token: conn.facebook_page_token,
          }),
        }
      );
      const containerData = await containerRes.json();

      if (containerData.error) {
        return NextResponse.json({ error: containerData.error.message }, { status: 400 });
      }

      // Step 2: Publish the container
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${conn.instagram_account_id}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: conn.facebook_page_token,
          }),
        }
      );
      const publishData = await publishRes.json();

      if (publishData.error) {
        return NextResponse.json({ error: publishData.error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, postId: publishData.id, platform: "instagram" });
    }

    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  } catch (err) {
    console.error("Meta post error:", err);
    return NextResponse.json({ error: "Failed to post. Please try again." }, { status: 500 });
  }
}
