import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveRequestAppUrl } from "@/lib/app-url";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

function getOAuthErrorMessage(searchParams: URLSearchParams) {
  const error = searchParams.get("error");
  const code = searchParams.get("error_code");
  const description = searchParams.get("error_description");

  if (!error && !description) return null;

  if (
    code === "flow_state_already_used" ||
    description?.toLowerCase().includes("state has already been used")
  ) {
    return "That Google sign-in attempt has already been used. Please start a fresh Google sign-in from Kiosk POS.";
  }

  return description ?? error ?? "Sign-in failed.";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/select-organization";
  const origin = resolveRequestAppUrl(request);
  const safeNext = next.startsWith("/") ? next : "/select-organization";

  if (!code) {
    const message = getOAuthErrorMessage(searchParams);
    const query = message ? `?message=${encodeURIComponent(message)}` : "";
    return NextResponse.redirect(`${origin}/auth/auth-code-error${query}`);
  }

  const redirectUrl = `${origin}${safeNext}`;
  const response = NextResponse.redirect(redirectUrl);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const query = `?message=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(`${origin}/auth/auth-code-error${query}`);
  }

  await supabase.rpc("ensure_profile_for_current_user");

  return response;
}
