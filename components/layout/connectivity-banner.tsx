"use client";

import Link from "next/link";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { SyncEngine } from "@/lib/offline/sync-engine";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ConnectivityBanner() {
  const { status } = useConnectivityStore();
  const { items, isSyncing, syncProgress } = useOfflineQueueStore();
  const pendingCount = items.filter(
    (item) => item.status === "pending" || item.status === "failed",
  ).length;
  const conflictCount = items.filter((item) => item.status === "conflict").length;
  const isOnline =
    status === "online" ||
    status === "limited-functionality" ||
    status === "reconnecting";

  if (status === "online" && pendingCount === 0 && conflictCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-[60] flex w-full flex-col gap-2 px-4 py-2 text-xs font-bold transition-all sm:flex-row sm:items-center sm:justify-between",
        status === "offline"
          ? "bg-destructive text-destructive-foreground"
          : status === "reconnecting"
            ? "bg-amber-600 text-white"
            : conflictCount > 0
              ? "bg-rose-700 text-white"
              : "bg-primary text-primary-foreground",
      )}
    >
      <div className="flex items-center gap-2">
        {status === "offline" ? (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>
              Offline mode — {pendingCount} sale
              {pendingCount === 1 ? "" : "s"} waiting to sync. Checkout still
              works.
            </span>
          </>
        ) : status === "reconnecting" ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Back online — syncing {pendingCount} item(s)...</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Syncing offline data ({syncProgress}%)...</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {pendingCount} pending
              {conflictCount > 0 ? `, ${conflictCount} conflict(s)` : ""} — tap
              Sync now
            </span>
          </>
        )}
      </div>

      {(pendingCount > 0 || conflictCount > 0) && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs font-bold"
            disabled={!isOnline || isSyncing}
            onClick={() => void SyncEngine.processQueue()}
          >
            Sync now
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-white/30 text-xs font-bold text-inherit"
            asChild
          >
            <Link href="/pos/queue">Details</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
