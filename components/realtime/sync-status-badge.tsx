"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { CheckCircle2, Loader2, WifiOff, CloudAlert } from "lucide-react";
import Link from "next/link";

export function SyncStatusBadge() {
  const { connectionStatus } = useRealtimeStore();
  const status = useConnectivityStore((state) => state.status);
  const { items: queueItems, isSyncing } = useOfflineQueueStore();

  const isOnline = status === "online" || status === "limited-functionality";
  const unsyncedCount = queueItems.length;

  if (!isOnline) {
    return (
      <Link href="/pos/queue">
        <Badge
          variant="secondary"
          className="h-9 gap-2 px-3 border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all font-bold cursor-pointer"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline {unsyncedCount > 0 && `(${unsyncedCount})`}</span>
        </Badge>
      </Link>
    );
  }

  if (isSyncing) {
    return (
      <Badge
        variant="secondary"
        className="h-9 gap-2 px-3 border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Syncing...</span>
      </Badge>
    );
  }

  if (unsyncedCount > 0) {
    return (
      <Link href="/pos/queue">
        <Badge
          variant="secondary"
          className="h-9 gap-2 px-3 border-amber-500/30 bg-amber-500/20 text-amber-900 dark:text-amber-300 hover:bg-amber-500/30 transition-all font-bold cursor-pointer"
        >
          <CloudAlert className="h-3.5 w-3.5" />
          <span>{unsyncedCount} unsynced</span>
        </Badge>
      </Link>
    );
  }

  const liveConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";
  const hasRealtimeError = connectionStatus === "error";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-9 gap-2 px-3 font-bold",
        liveConnected || !hasRealtimeError
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      )}
    >
      {liveConnected ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : isConnecting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : !hasRealtimeError ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <CloudAlert className="h-3.5 w-3.5" />
      )}
      <span>{liveConnected ? "Live" : isConnecting ? "Connecting..." : hasRealtimeError ? "Realtime issue" : "Online"}</span>
    </Badge>
  );
}
