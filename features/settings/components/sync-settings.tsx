"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { SyncEngine } from "@/lib/offline/sync-engine";
import {
  exportOfflineBackup,
  clearSyncedLocalData,
} from "@/lib/offline/backup";
import {
  formatLastSyncLabel,
  getOfflineSettings,
} from "@/lib/offline/offline-metadata";
import { listSyncConflicts, resolveSyncConflict } from "@/lib/offline/conflicts";
import { SyncConflictRecord } from "@/types/offline";
import { toast } from "sonner";
import {
  AlertTriangle,
  Cloud,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";

export function SyncSettings() {
  const { items, loadQueue, isSyncing } = useOfflineQueueStore();
  const status = useConnectivityStore((state) => state.status);
  const isOnline =
    status === "online" ||
    status === "limited-functionality" ||
    status === "reconnecting";

  const [settingsLabel, setSettingsLabel] = useState("Never synced");
  const [catalogLabel, setCatalogLabel] = useState("Never synced");
  const [customerLabel, setCustomerLabel] = useState("Never synced");
  const [conflicts, setConflicts] = useState<SyncConflictRecord[]>([]);
  const [busy, setBusy] = useState(false);

  const pending = items.filter(
    (item) => item.status === "pending" || item.status === "failed",
  ).length;
  const conflictCount = items.filter((item) => item.status === "conflict").length;
  const failed = items.filter((item) => item.status === "failed").length;

  const refresh = useCallback(async () => {
    await loadQueue();
    const settings = await getOfflineSettings();
    setSettingsLabel(formatLastSyncLabel(settings.lastSuccessfulSyncAt));
    setCatalogLabel(formatLastSyncLabel(settings.catalogLastSyncedAt));
    setCustomerLabel(formatLastSyncLabel(settings.customersLastSyncedAt));
    setConflicts(await listSyncConflicts());
  }, [loadQueue]);

  useEffect(() => {
    refresh();
  }, [refresh, isSyncing, items.length]);

  const runSync = async () => {
    if (!isOnline) {
      toast.error("You are offline. Connect to sync.");
      return;
    }
    setBusy(true);
    try {
      await SyncEngine.processQueue();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const refreshCatalogs = async () => {
    if (!isOnline) {
      toast.error("You are offline.");
      return;
    }
    setBusy(true);
    try {
      await Promise.all([
        SyncEngine.syncProductCatalog(),
        SyncEngine.syncCustomerCatalog(),
      ]);
      toast.success("Local catalogs refreshed.");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Catalog refresh failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Offline sync</h2>
        <p className="text-sm text-muted-foreground">
          Monitor queued sales, conflicts, and local backups for unstable
          connectivity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending sales</CardDescription>
            <CardTitle className="text-3xl">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-destructive">{failed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Queue conflicts</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {conflictCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recorded conflicts</CardDescription>
            <CardTitle className="text-3xl">{conflicts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Sync status
          </CardTitle>
          <CardDescription>
            Last successful queue sync: {settingsLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <Badge variant="outline">Products: {catalogLabel}</Badge>
          <Badge variant="outline">Customers: {customerLabel}</Badge>
          <Button onClick={runSync} disabled={busy || isSyncing || !isOnline}>
            {busy || isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync now
          </Button>
          <Button variant="outline" onClick={refreshCatalogs} disabled={busy}>
            Refresh catalogs
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pos/queue">
              Open offline queue
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Conflict log
          </CardTitle>
          <CardDescription>
            Sales or stock issues that need review after sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {conflicts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open conflicts.</p>
          ) : (
            conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{conflict.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {conflict.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conflict.createdAt).toLocaleString()} ·{" "}
                    {conflict.entityType}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await resolveSyncConflict(conflict.id);
                    await refresh();
                    toast.success("Conflict marked resolved.");
                  }}
                >
                  Mark resolved
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & cleanup</CardTitle>
          <CardDescription>
            Export pending offline data for recovery. Cleared data never removes
            unsynced sales.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await exportOfflineBackup();
                toast.success("Backup downloaded.");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Export failed.",
                );
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export backup JSON
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await clearSyncedLocalData();
                await refresh();
                toast.success("Synced local queue data cleared.");
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Cleanup blocked.",
                );
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear synced queue only
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
