"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAlerts, useAcknowledgeAlert } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/store/use-notification-store";
import { AlertTriangle } from "lucide-react";

export function AcknowledgementModal() {
  const alertId = useNotificationStore((state) => state.acknowledgementAlertId);
  const setAlertId = useNotificationStore((state) => state.setAcknowledgementAlertId);
  const alerts = useAlerts({ status: "open" });
  const acknowledge = useAcknowledgeAlert();
  const alert = alerts.data?.find((entry) => entry.id === alertId);

  return (
    <Dialog open={Boolean(alertId)} onOpenChange={(open) => !open && setAlertId(null)}>
      <DialogContent className="max-w-[460px] border-destructive/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Critical alert
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <h3 className="font-semibold">{alert?.title ?? "Alert requires acknowledgement"}</h3>
          <p className="text-sm text-muted-foreground">{alert?.message ?? "Review this alert before continuing."}</p>
        </div>
        <Button
          className="h-11"
          onClick={() => {
            if (alertId) acknowledge.mutate(alertId, { onSuccess: () => setAlertId(null) });
          }}
          disabled={acknowledge.isPending}
        >
          Acknowledge alert
        </Button>
      </DialogContent>
    </Dialog>
  );
}
