import { createClient } from "@/lib/supabase/client";
import {
  getFromStore,
  putInStore,
  deleteFromStore,
  bulkPutInStore,
  getAllFromStore,
  QueueItem,
} from "@/lib/storage/db";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { useOrganizationStore } from "@/store/use-organization-store";
import { toast } from "sonner";
import { CompletedReceipt } from "@/types/pos";
import { updateOfflineSettings } from "@/lib/offline/offline-metadata";
import { getDeviceId } from "@/lib/offline/device-id";
import { cacheCustomersDelta } from "@/lib/offline/customers";
import { recordSyncConflict } from "@/lib/offline/conflicts";
import { notifyNativeSyncFailure } from "@/lib/native/native-notifications";
import { Database } from "@/types/database";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

export class SyncEngine {
  private static isProcessing = false;
  private static retryTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  /**
   * Syncs the entire offline transaction queue.
   */
  static async processQueue() {
    if (this.isProcessing) return;

    const connectivity = useConnectivityStore.getState().status;
    const isOnline =
      connectivity === "online" ||
      connectivity === "limited-functionality" ||
      connectivity === "reconnecting";

    if (!isOnline) {
      console.log("[SyncEngine] Offline, skipping sync queue processing.");
      return;
    }

    const queueStore = useOfflineQueueStore.getState();
    await queueStore.loadQueue();
    const queueItems = queueStore.items.filter(
      (item) => item.status === "pending" || item.status === "failed"
    );

    if (queueItems.length === 0) {
      console.log("[SyncEngine] Sync queue is empty.");
      await updateOfflineSettings({
        lastSuccessfulSyncAt: new Date().toISOString(),
        lastSyncError: null,
      });
      return;
    }

    this.isProcessing = true;
    queueStore.setSyncing(true);
    console.log(`[SyncEngine] Starting sync of ${queueItems.length} transactions.`);

    let completedCount = 0;

    for (const item of queueItems) {
      // Re-verify network during loop
      const currentConnectivity = useConnectivityStore.getState().status;
      const currentlyOnline =
        currentConnectivity === "online" ||
        currentConnectivity === "limited-functionality" ||
        currentConnectivity === "reconnecting";
      if (!currentlyOnline) {
        console.log("[SyncEngine] Network dropped during sync. Halting.");
        break;
      }

      const success = await this.syncItem(item);
      if (success) {
        completedCount++;
      } else {
        // If it was a network failure, we halt the queue to avoid spamming failed requests
        const recheckItem = await getFromStore<QueueItem>("queue", item.id);
        if (recheckItem && recheckItem.status === "failed") {
          console.log("[SyncEngine] Network error encountered. Halting queue processing.");
          break;
        }
      }

      // Update progress bar
      queueStore.setSyncProgress(Math.round((completedCount / queueItems.length) * 100));
    }

    queueStore.setSyncing(false);
    queueStore.setSyncProgress(0);
    this.isProcessing = false;

    // Refresh products catalog after transactions sync to reconcile stock quantities
    const failedCount = useOfflineQueueStore
      .getState()
      .items.filter((item) => item.status === "failed" || item.status === "conflict")
      .length;

    if (completedCount > 0) {
      await Promise.all([this.syncProductCatalog(), this.syncCustomerCatalog()]);
      toast.success(`Successfully synced ${completedCount} offline sale(s).`);
      await updateOfflineSettings({
        lastSuccessfulSyncAt: new Date().toISOString(),
        lastSyncError: null,
      });
    } else if (failedCount > 0) {
      await updateOfflineSettings({
        lastSyncError: `${failedCount} sale(s) need attention in the offline queue.`,
      });
    }
  }

  /**
   * Syncs a single queued transaction.
   */
  private static async syncItem(item: QueueItem): Promise<boolean> {
    const queueStore = useOfflineQueueStore.getState();
    const supabase = createClient();

    console.log(`[SyncEngine] Syncing transaction ${item.id}...`);
    await queueStore.updateItemStatus(item.id, "syncing");

    try {
      // Format items and payments according to what process_checkout RPC expects
      const rpcItems = item.items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        unit_cost: i.unit_cost,
        discount_amount: i.discount_amount,
        tax_amount: i.tax_amount,
        line_total: i.line_total,
        note: i.note || null,
      }));

      const rpcPayments = item.payments.map((p) => ({
        payment_method: p.payment_method,
        amount: p.amount,
        reference: p.reference || null,
      }));

      const idempotencyKey = item.idempotencyKey ?? item.id;
      const receiptNumber = item.receiptNumber;

      const { data: saleId, error } = await supabase.rpc("process_checkout", {
        p_organization_id: item.organizationId,
        p_cashier_id: item.cashierId,
        p_session_id: item.sessionId,
        p_customer_id: item.customerId ?? null,
        p_subtotal: item.subtotal,
        p_tax_amount: item.taxAmount,
        p_discount_amount: item.discountAmount,
        p_total_amount: item.totalAmount,
        p_items: rpcItems,
        p_payments: rpcPayments,
        p_client_sale_id: idempotencyKey,
        p_receipt_number: receiptNumber ?? null,
        p_device_id: item.deviceId ?? getDeviceId(),
      } as never);

      if (error) {
        throw error;
      }

      console.log(`[SyncEngine] Successfully synced sale! Server Sale ID: ${saleId}`);

      // Update local receipt record to reference the server Sale ID
      const localReceipt = await getFromStore<CompletedReceipt>("receipts", item.id);
      if (localReceipt) {
        // Delete from old key
        await deleteFromStore("receipts", item.id);
        // Put under new key
        const updatedReceipt: CompletedReceipt = {
          ...localReceipt,
          saleId: saleId as string,
          remoteSaleId: saleId as string,
          receiptNumber: localReceipt.receiptNumber,
          isOfflinePending: false,
        };
        await putInStore<CompletedReceipt>("receipts", updatedReceipt);
      }

      // Dequeue from sync list
      await queueStore.dequeueSale(item.id);
      return true;
    } catch (error: any) {
      console.error(`[SyncEngine] Error syncing transaction ${item.id}:`, error);

      // Distinguish between network failures and business validation conflicts
      const errorMsg = error.message || String(error);
      const isConflict =
        errorMsg.includes("Insufficient stock") ||
        errorMsg.includes("Product is unavailable") ||
        errorMsg.includes("is not a member of this organization") ||
        errorMsg.includes("Unauthorized cashier") ||
        errorMsg.includes("No active register session");

      if (isConflict) {
        // Business logic error - requires cashier review in Conflict Modal
        console.warn(`[SyncEngine] Transaction conflict detected on ${item.id}: ${errorMsg}`);
        await queueStore.updateItemStatus(item.id, "conflict", errorMsg, {
          error: errorMsg,
          failedAt: new Date().toISOString(),
        });

        // Register conflict in realtime store so global notification modal triggers
        useRealtimeStore.getState().addConflict({
          type: errorMsg.includes("stock") ? "inventory" : "checkout",
          title: "Sync Conflict: " + (errorMsg.includes("stock") ? "Stock Deficiency" : "Checkout Rejected"),
          message: `Sale offline total ${item.totalAmount} failed sync: ${errorMsg}. Please resolve in the Offline Queue.`,
          entityId: item.id,
        });

        await recordSyncConflict({
          entityType: errorMsg.includes("stock") ? "inventory" : "sale",
          entityLocalId: item.id,
          title: errorMsg.includes("stock") ? "Stock deficiency" : "Checkout rejected",
          message: errorMsg,
          details: { totalAmount: item.totalAmount, receiptNumber: item.receiptNumber },
        });

        toast.error(`Sync conflict on offline sale: ${errorMsg}`);
        void notifyNativeSyncFailure(
          `Sync conflict: ${errorMsg.slice(0, 120)}`,
        );
      } else {
        // Network connection error - retry later
        await queueStore.updateItemStatus(item.id, "failed", errorMsg);
        await queueStore.incrementRetryCount(item.id);

        void notifyNativeSyncFailure(
          `Offline sale failed to sync. Will retry when online.`,
        );

        const updatedItem = await getFromStore<QueueItem>("queue", item.id);
        if (updatedItem) {
          this.scheduleRetry(updatedItem);
        }
      }

      return false;
    }
  }

  /**
   * Schedule automatic retry with exponential backoff.
   */
  private static scheduleRetry(item: QueueItem) {
    if (this.retryTimeouts[item.id]) {
      clearTimeout(this.retryTimeouts[item.id]);
    }

    // Exponential backoff: 2s, 4s, 8s, 16s... capped at 1 minute
    const delay = Math.min(Math.pow(2, item.retryCount) * 1000, 60000);
    console.log(`[SyncEngine] Scheduling retry for ${item.id} in ${delay}ms (Attempt ${item.retryCount})`);

    this.retryTimeouts[item.id] = setTimeout(() => {
      delete this.retryTimeouts[item.id];
      const connectivity = useConnectivityStore.getState().status;
      const isOnline =
        connectivity === "online" ||
        connectivity === "limited-functionality" ||
        connectivity === "reconnecting";

      if (isOnline) {
        this.syncItem(item).then((success) => {
          if (success) {
            // Trigger a database catalog sync after successful retried sync
            this.syncProductCatalog();
          }
        });
      } else {
        // Reset to failed status to retry next time network is restored
        useOfflineQueueStore.getState().updateItemStatus(item.id, "failed", "Network offline during scheduled retry");
      }
    }, delay);
  }

  /**
   * Downloads the complete active product catalog and categories from Supabase, caching them in IndexedDB.
   */
  static async syncProductCatalog() {
    const activeOrganizationId = useOrganizationStore.getState().activeOrganizationId;
    if (!activeOrganizationId) return;

    const currentConnectivity = useConnectivityStore.getState().status;
    const isOnline =
      currentConnectivity === "online" ||
      currentConnectivity === "limited-functionality" ||
      currentConnectivity === "reconnecting";

    if (!isOnline) {
      console.log("[SyncEngine] Offline: cannot refresh product catalog.");
      return;
    }

    console.log("[SyncEngine] Syncing active product catalog and categories from server...");
    const supabase = createClient();

    try {
      const { getOfflineSettings } = await import("@/lib/offline/offline-metadata");
      const settings = await getOfflineSettings();
      const lastSynced = settings.catalogLastSyncedAt;

      let productsQuery = supabase
        .from("products")
        .select("*, categories(name)")
        .eq("organization_id", activeOrganizationId)
        .eq("is_active", true);

      if (lastSynced) {
        productsQuery = productsQuery.or(
          `updated_at.gte.${lastSynced},created_at.gte.${lastSynced}`,
        );
      } else {
        productsQuery = productsQuery.order("name", { ascending: true });
      }

      const { data: deltaProducts, error: productsError } = await productsQuery;
      if (productsError) throw productsError;

      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("organization_id", activeOrganizationId)
        .order("name");

      if (categoriesError) throw categoriesError;

      if (lastSynced && deltaProducts && deltaProducts.length > 0) {
        for (const product of deltaProducts) {
          await putInStore("products", product);
        }
      } else if (!lastSynced) {
        const { data: allProducts } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("organization_id", activeOrganizationId)
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (allProducts) {
          await bulkPutInStore("products", allProducts);
        }
      }

      if (categories) {
        await bulkPutInStore("categories", categories);
      }

      const cachedCount = lastSynced
        ? (deltaProducts?.length ?? 0)
        : (await getAllFromStore("products")).length;

      await updateOfflineSettings({
        catalogLastSyncedAt: new Date().toISOString(),
        lastSyncError: null,
      });

      console.log(
        `[SyncEngine] Product catalog sync complete. ${lastSynced ? "Updated" : "Cached"} ${cachedCount} products.`,
      );
    } catch (error) {
      console.error("[SyncEngine] Failed to refresh local catalog cache:", error);
    }
  }

  /**
   * Delta-sync customers for walk-in lookup during offline checkout.
   */
  static async syncCustomerCatalog() {
    const activeOrganizationId = useOrganizationStore.getState().activeOrganizationId;
    if (!activeOrganizationId) return;

    const currentConnectivity = useConnectivityStore.getState().status;
    const isOnline =
      currentConnectivity === "online" ||
      currentConnectivity === "limited-functionality" ||
      currentConnectivity === "reconnecting";

    if (!isOnline) return;

    const supabase = createClient();

    try {
      const { getOfflineSettings } = await import("@/lib/offline/offline-metadata");
      const settings = await getOfflineSettings();
      const lastSynced = settings.customersLastSyncedAt;

      let query = supabase
        .from("customers")
        .select("*")
        .eq("organization_id", activeOrganizationId)
        .order("full_name", { ascending: true })
        .limit(5000);

      if (lastSynced) {
        query = query.or(`updated_at.gte.${lastSynced},created_at.gte.${lastSynced}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!lastSynced) {
        await cacheCustomersDelta((data ?? []) as CustomerRow[], true);
      } else if (data && data.length > 0) {
        await cacheCustomersDelta(data as CustomerRow[]);
      } else {
        await updateOfflineSettings({
          customersLastSyncedAt: new Date().toISOString(),
        });
      }

      console.log(
        `[SyncEngine] Customer cache sync complete. ${lastSynced ? "Updated" : "Cached"} ${data?.length ?? 0} customers.`,
      );
    } catch (error) {
      console.error("[SyncEngine] Failed to refresh local customer cache:", error);
    }
  }
}
