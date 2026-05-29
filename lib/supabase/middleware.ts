import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const OAUTH_RETURN_PARAMS = [
  "code",
  "error",
  "error_code",
  "error_description",
  "sb",
];

function isOAuthReturnToRoot(request: NextRequest) {
  return (
    request.nextUrl.pathname === "/" &&
    OAUTH_RETURN_PARAMS.some((key) => request.nextUrl.searchParams.has(key))
  );
}

const AUTH_FLOW_PATHS = new Set(["/auth/callback", "/auth/google"]);

function isAuthFlowPath(pathname: string) {
  return AUTH_FLOW_PATHS.has(pathname);
}

export async function updateSession(request: NextRequest) {
  if (isOAuthReturnToRoot(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Do not refresh or mutate Supabase auth cookies during OAuth — that can
  // clear the PKCE code verifier before exchangeCodeForSession runs.
  if (isAuthFlowPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

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
  const isInvitationPage = request.nextUrl.pathname.startsWith("/invite/");
  const isPublicPage =
    isAuthPage ||
    request.nextUrl.pathname === "/" ||
    isPublicLegalPage ||
    isInvitationPage;
  const isPublicRuntimeAsset =
    request.nextUrl.pathname === "/sw.js" ||
    request.nextUrl.pathname === "/offline.html" ||
    request.nextUrl.pathname === "/manifest.webmanifest";
  const isBillingWebhook = request.nextUrl.pathname === "/api/billing/webhook";
  const isYoPaymentsWebhook =
    request.nextUrl.pathname === "/api/payments/yo/webhook";
  const isInvitationActivationApi =
    request.nextUrl.pathname === "/api/invitations/activate";
  const isOrganizationSelectionPage = request.nextUrl.pathname.startsWith(
    "/select-organization",
  );
  const isExplorePage = request.nextUrl.pathname === "/dashboard";

  if (
    !user &&
    !isPublicPage &&
    !isPublicRuntimeAsset &&
    !isBillingWebhook &&
    !isYoPaymentsWebhook &&
    !isInvitationActivationApi
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  if (user) {
    await supabase.rpc("ensure_profile_for_current_user");
    const { data: hasMembership } = await supabase.rpc(
      "has_active_organization_membership",
    );
    const member = Boolean(hasMembership);

    if (
      !member &&
      !request.nextUrl.pathname.startsWith("/onboarding") &&
      !isPublicPage &&
      !isInvitationActivationApi &&
      !isOrganizationSelectionPage &&
      !isExplorePage
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
