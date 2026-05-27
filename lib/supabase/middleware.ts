import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/auth");
  const isPublicLegalPage =
    request.nextUrl.pathname === "/privacy" ||
    request.nextUrl.pathname === "/terms";
  const isPublicPage =
    isAuthPage || request.nextUrl.pathname === "/" || isPublicLegalPage;
  const isPublicRuntimeAsset =
    request.nextUrl.pathname === "/sw.js" ||
    request.nextUrl.pathname === "/offline.html" ||
    request.nextUrl.pathname === "/manifest.webmanifest";
  const isBillingWebhook = request.nextUrl.pathname === "/api/billing/webhook";
  const isOrganizationSelectionPage = request.nextUrl.pathname.startsWith(
    "/select-organization",
  );

  if (!user && !isPublicPage && !isPublicRuntimeAsset && !isBillingWebhook) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: hasMembership } = await supabase.rpc(
      "has_active_organization_membership",
    );
    const member = Boolean(hasMembership);

    if (
      !member &&
      !request.nextUrl.pathname.startsWith("/onboarding") &&
      !isPublicPage &&
      !isOrganizationSelectionPage
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (member && request.nextUrl.pathname.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/select-organization";
      return NextResponse.redirect(url);
    }

    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = member ? "/select-organization" : "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
