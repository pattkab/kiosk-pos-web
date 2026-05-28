import {
  clearStore,
  deleteFromStore,
  getAllFromStore,
  QueueItem,
} from "@/lib/storage/db";
import { CompletedReceipt } from "@/types/pos";
import { LocalInventoryMovement } from "@/lib/offline/inventory-movement";
import { getOfflineSettings } from "@/lib/offline/offline-metadata";
import { listSyncConflicts } from "@/lib/offline/conflicts";

export async function exportOfflineBackup() {
  const [queue, receipts, movements, settings, conflicts] = await Promise.all([
    getAllFromStore<QueueItem>("queue"),
    getAllFromStore<CompletedReceipt>("receipts"),
    getAllFromStore<LocalInventoryMovement>("inventory_movements"),
    getOfflineSettings(),
    listSyncConflicts(true),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    settings,
    pendingSales: queue.filter(
      (item) => item.status !== "synced",
    ),
    receipts,
    inventoryMovements: movements.filter((m) => m.syncStatus === "pending"),
    conflicts,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kiosk-pos-offline-backup-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return payload;
}

export async function clearSyncedLocalData() {
  const queue = await getAllFromStore<QueueItem>("queue");
  const pending = queue.filter((item) => item.status !== "synced");
  if (pending.length > 0) {
    throw new Error(
      "Cannot clear local data while unsynced sales are still pending.",
    );
  }

  await clearStore("queue");
  const movements = await getAllFromStore<LocalInventoryMovement>(
    "inventory_movements",
  );
  for (const movement of movements.filter((m) => m.syncStatus === "synced")) {
    await deleteFromStore("inventory_movements", movement.id);
  }
}
