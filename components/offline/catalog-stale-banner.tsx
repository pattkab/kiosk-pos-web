"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatLastSyncLabel,
  getCatalogStaleDays,
  getOfflineSettings,
} from "@/lib/offline/offline-metadata";

export function CatalogStaleBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getOfflineSettings().then((settings) => {
      const staleDays = getCatalogStaleDays(settings.catalogLastSyncedAt);
      if (staleDays === null) {
        setMessage(
          "Product catalog has not been cached for offline use yet. Sync while online before going offline.",
        );
        return;
      }
      if (staleDays >= settings.catalogFreshnessWarningDays) {
        setMessage(
          `Product data last synced ${staleDays} day${staleDays === 1 ? "" : "s"} ago (${formatLastSyncLabel(settings.catalogLastSyncedAt)}). Prices or stock may be outdated.`,
        );
      }
    });
  }, []);

  if (!message) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="font-medium text-amber-950">{message}</p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" asChild>
        <Link href="/pos/queue">Open sync</Link>
      </Button>
    </div>
  );
}
