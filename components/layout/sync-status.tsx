"use client";

import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import {
  CloudOff,
  CloudDownload,
  CloudUpload,
  Database,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SyncStatus() {
  const { items, isSyncing } = useOfflineQueueStore();
  const { status } = useConnectivityStore();

  const pendingCount = items.filter(i => i.status === "pending" || i.status === "failed").length;
  const conflictCount = items.filter(i => i.status === "conflict").length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-muted cursor-default transition-colors">
            {status === "offline" ? (
              <CloudOff className="h-4 w-4 text-destructive" />
            ) : isSyncing ? (
              <CloudUpload className="h-4 w-4 text-primary animate-pulse" />
            ) : conflictCount > 0 ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : pendingCount > 0 ? (
              <Database className="h-4 w-4 text-warning" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}

            {(pendingCount > 0 || conflictCount > 0) && (
              <span className="text-[10px] font-black tabular-nums">
                {pendingCount + conflictCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-widest text-[9px] opacity-50">Storage Status</p>
            <div className="flex items-center justify-between gap-4">
              <span>Network</span>
              <span className={cn("font-bold", status === "online" ? "text-emerald-500" : "text-destructive")}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Local Queue</span>
              <span className="font-bold">{pendingCount}</span>
            </div>
            {conflictCount > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span>Conflicts</span>
                <span className="font-bold text-destructive">{conflictCount}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
