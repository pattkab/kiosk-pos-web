"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertPriority } from "@/types/notifications";

export function PriorityBadge({ priority }: { priority: AlertPriority }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "capitalize",
        priority === "critical" && "border-destructive/30 bg-destructive/10 text-destructive",
        priority === "high" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        priority === "medium" && "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        priority === "low" && "text-muted-foreground"
      )}
    >
      {priority}
    </Badge>
  );
}
