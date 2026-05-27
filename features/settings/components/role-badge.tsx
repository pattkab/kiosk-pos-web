"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/auth/permissions";

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "capitalize",
        role === "owner" && "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
        role === "admin" && "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        role === "manager" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      )}
    >
      {role}
    </Badge>
  );
}
