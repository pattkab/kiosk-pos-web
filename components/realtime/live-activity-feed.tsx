"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { Activity } from "lucide-react";

export function LiveActivityFeed() {
  const activity = useRealtimeStore((state) => state.activityFeed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Live activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {activity.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Activity will appear here as the team works.
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((entry) => {
                const total = typeof entry.metadata === "object" && entry.metadata && "total" in entry.metadata
                  ? Number(entry.metadata.total)
                  : null;

                return (
                  <div key={entry.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {entry.actor} {entry.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.entityType}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {total !== null && <p className="mt-2 text-sm font-bold">{formatCurrency(total)}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
