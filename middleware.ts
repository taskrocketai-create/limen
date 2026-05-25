import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isPreview =
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === "https://placeholder.supabase.co" ||
    supabaseKey === "placeholder-anon-key";

  if (isPreview) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const protectedPrefixes = ["/dashboard", "/listings", "/settings"];

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Redirect unauthenticated users to login
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Subscription paywall — check active/trialing status
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_subscription_status, onboarding_completed")
      .eq("id", user.id)
      .single();

    const status = (profile as { stripe_subscription_status?: string; onboarding_completed?: boolean } | null)?.stripe_subscription_status;
    const onboardingCompleted = (profile as { onboarding_completed?: boolean } | null)?.onboarding_completed ?? false;
    const isSubscribed = status === "active" || status === "trialing";

    const isBillingPath = pathname.startsWith("/settings/billing") || pathname === "/subscribe";
    const isOnboardingPath = pathname === "/onboarding";

    if (!isSubscribed && !isBillingPath && !isOnboardingPath) {
      const subscribeUrl = request.nextUrl.clone();
      subscribeUrl.pathname = "/subscribe";
      return NextResponse.redirect(subscribeUrl);
    }

    // Redirect to onboarding if not completed (but not if already there)
    if (isSubscribed && !onboardingCompleted && pathname === "/dashboard" && !isOnboardingPath) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|intake|api/intake|api/stripe).*)",
  ],
};

