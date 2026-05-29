import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getOAuthCallbackUrl } from "@/lib/auth/oauth";
import { getNativeOAuthCallbackUrl } from "@/lib/auth/native-oauth";
import { resolveRequestAppUrl } from "@/lib/app-url";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/select-organization";
  const safeNext = next.startsWith("/") ? next : "/select-organization";
  const origin = resolveRequestAppUrl(request);
  const cookieStore = await cookies();

  let response = NextResponse.redirect(`${origin}/login`);

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

  const native = searchParams.get("native") === "1";
  const redirectTo = native
    ? getNativeOAuthCallbackUrl(safeNext)
    : getOAuthCallbackUrl(safeNext);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    const message = error?.message ?? "Google sign-in could not be started.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }

  response = NextResponse.redirect(data.url, { headers: response.headers });
  return response;
}
