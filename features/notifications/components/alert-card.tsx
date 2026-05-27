"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperationalAlert } from "@/types/notifications";
import { PriorityBadge } from "./priority-badge";
import { useAcknowledgeAlert, useNotificationActions } from "@/hooks/use-notifications";
import { Archive, CheckCircle2, ExternalLink } from "lucide-react";

export function AlertCard({ alert }: { alert: OperationalAlert }) {
  const acknowledge = useAcknowledgeAlert();
  const actions = useNotificationActions();
  const isCritical = alert.priority === "critical" && alert.status === "open";

  return (
    <Card className={isCritical ? "border-destructive/40 bg-destructive/5" : undefined}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={alert.priority} />
              <Badge variant="outline" className="capitalize">{alert.type.replaceAll("_", " ")}</Badge>
              <Badge variant={alert.status === "open" ? "default" : "secondary"} className="capitalize">
                {alert.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold">{alert.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(alert.created_at ?? new Date()).toLocaleString()}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {alert.action_url && (
              <Button variant="outline" size="sm" asChild>
                <Link href={alert.action_url}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Link>
              </Button>
            )}
            {alert.status === "open" && (
              <Button size="sm" onClick={() => acknowledge.mutate(alert.id)} disabled={acknowledge.isPending}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Acknowledge
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.archiveAlert.mutate(alert.id)}
              disabled={actions.archiveAlert.isPending}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
