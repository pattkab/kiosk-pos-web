"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-muted p-8">
        <WifiOff className="h-16 w-16 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-black tracking-tight">You are offline</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Kiosk POS needs an internet connection to load this page for the first time.
        Once loaded, the POS and Inventory modules will work without internet.
      </p>
      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={() => window.location.reload()} className="h-12 text-lg font-bold">
          <RefreshCw className="mr-2 h-5 w-5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
