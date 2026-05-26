import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-muted-foreground">Sorry, we couldn't find the page you're looking for.</p>
      <Button asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  );
}
