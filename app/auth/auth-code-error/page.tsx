import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRODUCTION_APP_URL } from "@/lib/app-url";

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const message = params.message;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f7f8fb] px-4">
      <div className="w-full max-w-lg rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Sign-in could not be completed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Google sign-in failed before your session could be created. This is
          usually a configuration issue between Google Cloud, Supabase, and the
          live app URL.
        </p>
        {message ? (
          <p className="mt-4 rounded-md border bg-muted/40 p-3 text-sm text-destructive">
            {message}
          </p>
        ) : null}
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            In Google Cloud Console → OAuth client, add authorized redirect URI:{" "}
            <code className="text-xs">
              https://&lt;project-ref&gt;.supabase.co/auth/v1/callback
            </code>
          </li>
          <li>
            In Supabase → Authentication → URL configuration, add redirect URLs
            for your app:{" "}
            <code className="text-xs">{PRODUCTION_APP_URL}/**</code>,{" "}
            <code className="text-xs">http://localhost:3000/**</code> for local
            development.
          </li>
          <li>
            In Supabase → Authentication → Providers → Google, verify Client ID
            and Client Secret match the Google OAuth client.
          </li>
          <li>
            Set <code className="text-xs">NEXT_PUBLIC_APP_URL</code> in
            production to your live site URL:{" "}
            <code className="text-xs">{PRODUCTION_APP_URL}</code>.
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
