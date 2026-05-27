"use client";

import { useRealtimeStore } from "@/store/use-realtime-store";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ConflictModal() {
  const { conflicts, resolveConflict } = useRealtimeStore();
  const { items, dequeueSale, updateItemStatus } = useOfflineQueueStore();

  const activeConflict = conflicts.find(c => !c.resolved);
  const queuedItem = activeConflict ? items.find(i => i.id === activeConflict.entityId) : null;

  if (!activeConflict || !queuedItem) return null;

  const handleDiscard = async () => {
    await dequeueSale(queuedItem.id);
    resolveConflict(activeConflict.id);
  };

  const handleRetry = async () => {
    await updateItemStatus(queuedItem.id, "pending");
    resolveConflict(activeConflict.id);
  };

  return (
    <Dialog open={!!activeConflict} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>{activeConflict.title}</DialogTitle>
          </div>
          <DialogDescription>
            {activeConflict.message}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Local Sale ID:</span>
            <span className="font-mono">{queuedItem.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold">{formatCurrency(queuedItem.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Error from Server:</span>
            <span className="text-destructive font-medium">{queuedItem.errorMessage}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleDiscard}>
            <Trash2 className="h-4 w-4" /> Discard Sale
          </Button>
          <Button className="flex-1 gap-2" onClick={handleRetry}>
            <RotateCcw className="h-4 w-4" /> Retry Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
