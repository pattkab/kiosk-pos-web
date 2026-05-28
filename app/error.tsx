"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getUserErrorMessage } from "@/lib/errors/user-message";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">
        {getUserErrorMessage(
          error,
          "Something went wrong while loading this page.",
        )}
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
