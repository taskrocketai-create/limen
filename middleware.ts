import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Refresh session — must not run any logic between createServerClient
  // and getUser(), as the Supabase docs require.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect realtor routes — redirect unauthenticated users to /login
  const { pathname } = request.nextUrl;
  const protectedPrefixes = ["/dashboard", "/listings"];

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // /intake/[token] is intentionally unauthenticated — never protect it
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - /intake/* (homeowner intake — always public)
     * - /api/intake/* (intake API routes — always public)
     */
    "/((?!_next/static|_next/image|favicon.ico|intake|api/intake).*)",
  ],
};
