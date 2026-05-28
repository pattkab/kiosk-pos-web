"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function GlobalProgressIndicator() {
  const fetchingCount = useIsFetching();
  const mutatingCount = useIsMutating();
  const activeTasks = fetchingCount + mutatingCount;
  const isActive = activeTasks > 0;

  if (!isActive) return null;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/15"
      >
        <div className="h-full w-1/3 animate-[progress-slide_1.2s_ease-in-out_infinite] bg-primary" />
      </div>
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-full border bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        Working in background...
      </div>
    </>
  );
}
