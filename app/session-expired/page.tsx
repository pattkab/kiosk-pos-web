import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SessionExpiredPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">Session Expired</h1>
      <p className="text-muted-foreground">Your session has expired. Please sign in again to continue.</p>
      <Button asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    </div>
  );
}
