"use client";

import { useEffect, useCallback, useRef } from "react";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useSyncEngine() {
  const {
    items,
    loadQueue,
    updateItemStatus,
    dequeueSale,
    setSyncing,
    setSyncProgress,
    incrementRetryCount
  } = useOfflineQueueStore();
  const { status } = useConnectivityStore();
  const supabase = createClient();
  const isSyncingRef = useRef(false);

  // Initial load
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const syncQueue = useCallback(async () => {
    if (status === "offline" || isSyncingRef.current) return;

    const pendingItems = items.filter(i => i.status === "pending" || i.status === "failed");
    if (pendingItems.length === 0) return;

    isSyncingRef.current = true;
    setSyncing(true);
    let completedCount = 0;

    toast.info(`Syncing ${pendingItems.length} offline transactions...`);

    for (const item of pendingItems) {
      try {
        await updateItemStatus(item.id, "syncing");

        const { error } = await supabase.rpc("process_checkout", {
          p_organization_id: item.organizationId,
          p_cashier_id: item.cashierId,
          p_session_id: item.sessionId,
          p_customer_id: null,
          p_subtotal: item.subtotal,
          p_tax_amount: item.taxAmount,
          p_discount_amount: item.discountAmount,
          p_total_amount: item.totalAmount,
          p_items: item.items,
          p_payments: item.payments,
        });

        if (error) {
          console.error(`[SyncEngine] Error syncing ${item.id}:`, error);
          await updateItemStatus(item.id, "failed", error.message);
          await incrementRetryCount(item.id);
        } else {
          await dequeueSale(item.id);
          completedCount++;
        }
      } catch (err: any) {
        await updateItemStatus(item.id, "failed", err.message);
      } finally {
        const progress = Math.round((completedCount / pendingItems.length) * 100);
        setSyncProgress(progress);
      }
    }

    isSyncingRef.current = false;
    setSyncing(false);
    setSyncProgress(0);

    if (completedCount > 0) {
      toast.success(`Successfully synced ${completedCount} transactions.`);
    }
  }, [status, items, supabase, updateItemStatus, dequeueSale, setSyncing, setSyncProgress, incrementRetryCount]);

  // Trigger sync on status change to online
  useEffect(() => {
    if (status === "online") {
      syncQueue();
    }
  }, [status, syncQueue]);

  // Periodic sync check every 1 minute
  useEffect(() => {
    const interval = setInterval(syncQueue, 60000);
    return () => clearInterval(interval);
  }, [syncQueue]);

  return { syncQueue };
}
