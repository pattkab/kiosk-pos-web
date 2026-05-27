"use client";

import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConnectivityBanner() {
  const { status } = useConnectivityStore();
  const { items, isSyncing, syncProgress } = useOfflineQueueStore();
  const pendingCount = items.filter(i => i.status === "pending" || i.status === "failed").length;

  if (status === "online" && pendingCount === 0) return null;

  return (
    <div className={cn(
      "sticky top-0 z-[60] flex w-full items-center justify-between px-4 py-2 text-xs font-bold transition-all",
      status === "offline" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
    )}>
      <div className="flex items-center gap-2">
        {status === "offline" ? (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>YOU ARE OFFLINE. Transactions will be saved locally and synced when connection returns.</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>SYNCING OFFLINE DATA ({syncProgress}%)...</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{pendingCount} PENDING SYNC</span>
          </>
        )}
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 tabular-nums">
          <span className="opacity-80">Local queue: {pendingCount}</span>
        </div>
      )}
    </div>
  );
}
