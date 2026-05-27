"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { AlertTriangle } from "lucide-react";

export function ConflictResolutionModal() {
  const conflict = useRealtimeStore((state) => state.conflicts.find((entry) => !entry.resolved));
  const resolveConflict = useRealtimeStore((state) => state.resolveConflict);

  return (
    <Dialog open={Boolean(conflict)} onOpenChange={(open) => !open && conflict && resolveConflict(conflict.id)}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {conflict?.title ?? "Sync conflict"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{conflict?.message}</p>
        <Button className="mt-2 h-11" onClick={() => conflict && resolveConflict(conflict.id)}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
