"use client";

import Link from "next/link";
import { CalendarCheck2, ClipboardCheck, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStockTakeReminder } from "@/hooks/use-stock-take-reminder";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function StockTakeReminder() {
  const { reminderState, completeStockTake } = useStockTakeReminder();

  if (!reminderState.enabled || !reminderState.isDue) return null;

  const dueCopy = reminderState.isOverdue
    ? `${Math.abs(reminderState.daysUntilDue)} day${
        Math.abs(reminderState.daysUntilDue) === 1 ? "" : "s"
      } overdue`
    : "Due today";

  return (
    <Card className="border-amber-300 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-50">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-50">
            <PackageSearch className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Stock reconciliation reminder</h2>
              <Badge
                variant="outline"
                className="border-amber-400 bg-background/70"
              >
                <CalendarCheck2 className="mr-1.5 h-3.5 w-3.5" />
                {dueCopy}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm text-amber-900/80 dark:text-amber-50/80">
              Count what is on the shelf and correct any differences in system
              inventory. This reminder repeats every{" "}
              {reminderState.intervalDays} day
              {reminderState.intervalDays === 1 ? "" : "s"}.
            </p>
            <p className="text-xs text-amber-900/70 dark:text-amber-50/70">
              Next due date was {formatDate(reminderState.nextDueAt)}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button
            variant="outline"
            asChild
            className="border-amber-400 bg-background/80"
          >
            <Link href="/inventory">
              <PackageSearch className="mr-2 h-4 w-4" />
              Open inventory
            </Link>
          </Button>
          <Button
            onClick={() => completeStockTake.mutate()}
            disabled={completeStockTake.isPending}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            {completeStockTake.isPending ? "Recording..." : "Mark completed"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
