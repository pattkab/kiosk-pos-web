import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">403</h1>
      <h2 className="text-2xl font-semibold">Unauthorized</h2>
      <p className="text-muted-foreground">You do not have permission to access this page.</p>
      <Button asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  );
}
