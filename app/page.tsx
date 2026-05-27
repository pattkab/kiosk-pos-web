import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OAuthErrorHandler } from "@/components/auth/oauth-error-handler";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <OAuthErrorHandler />
      <h1 className="mb-6 text-5xl font-extrabold tracking-tight lg:text-6xl">
        Kiosk <span className="text-primary">POS</span>
      </h1>
      <p className="mb-10 max-w-2xl text-xl text-muted-foreground">
        A modern, cloud-based POS and inventory management system designed for scale.
      </p>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <Button asChild size="lg">
          <Link href="/register">Create account</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms and Conditions
        </Link>
      </p>
    </div>
  );
}
