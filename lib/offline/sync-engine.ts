import { createClient } from "@/lib/supabase/client";
import { getFromStore, putInStore, deleteFromStore, bulkPutInStore, QueueItem } from "@/lib/storage/db";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { useOrganizationStore } from "@/store/use-organization-store";
import { toast } from "sonner";
import { CompletedReceipt } from "@/types/pos";

export class SyncEngine {
  private static isProcessing = false;
  private static retryTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  /**
   * Syncs the entire offline transaction queue.
   */
  static async processQueue() {
    if (this.isProcessing) return;

    const connectivity = useConnectivityStore.getState().status;
    const isOnline = connectivity === "online" || connectivity === "limited-functionality";

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
      return;
    }

    this.isProcessing = true;
    queueStore.setSyncing(true);
    console.log(`[SyncEngine] Starting sync of ${queueItems.length} transactions.`);

    let completedCount = 0;

    for (const item of queueItems) {
      // Re-verify network during loop
      const currentConnectivity = useConnectivityStore.getState().status;
      const currentlyOnline = currentConnectivity === "online" || currentConnectivity === "limited-functionality";
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
    if (completedCount > 0) {
      await this.syncProductCatalog();
      toast.success(`Successfully synced ${completedCount} offline transactions.`);
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

      // Call Supabase RPC
      const { data: saleId, error } = await supabase.rpc("process_checkout", {
        p_organization_id: item.organizationId,
        p_cashier_id: item.cashierId,
        p_session_id: item.sessionId,
        p_customer_id: null,
        p_subtotal: item.subtotal,
        p_tax_amount: item.taxAmount,
        p_discount_amount: item.discountAmount,
        p_total_amount: item.totalAmount,
        p_items: rpcItems,
        p_payments: rpcPayments,
      });

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
          receiptNumber: `R-${String(saleId).slice(0, 8).toUpperCase()}`,
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

        toast.error(`Sync conflict on offline sale: ${errorMsg}`);
      } else {
        // Network connection error - retry later
        await queueStore.updateItemStatus(item.id, "failed", errorMsg);
        await queueStore.incrementRetryCount(item.id);

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
      const isOnline = connectivity === "online" || connectivity === "limited-functionality";

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
    const isOnline = currentConnectivity === "online" || currentConnectivity === "limited-functionality";

    if (!isOnline) {
      console.log("[SyncEngine] Offline: cannot refresh product catalog.");
      return;
    }

    console.log("[SyncEngine] Syncing active product catalog and categories from server...");
    const supabase = createClient();

    try {
      // 1. Fetch all active products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("organization_id", activeOrganizationId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (productsError) throw productsError;

      // 2. Fetch all categories
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("organization_id", activeOrganizationId)
        .order("name");

      if (categoriesError) throw categoriesError;

      // 3. Store in IndexedDB
      if (products) {
        await bulkPutInStore("products", products);
      }
      if (categories) {
        await bulkPutInStore("categories", categories);
      }

      console.log(`[SyncEngine] Product catalog sync complete. Cached ${products?.length ?? 0} products.`);
    } catch (error) {
      console.error("[SyncEngine] Failed to refresh local catalog cache:", error);
    }
  }
}
