import { putInStore, getAllFromStore } from "@/lib/storage/db";

export type LocalInventoryMovement = {
  id: string;
  organizationId: string;
  productId: string;
  quantityDelta: number;
  movementType: "sale_deduction" | "adjustment" | "replenish";
  source: string;
  saleLocalId?: string;
  createdAt: string;
  syncStatus: "pending" | "synced" | "failed";
};

export async function recordLocalInventoryMovement(
  movement: Omit<LocalInventoryMovement, "id" | "syncStatus" | "createdAt"> & {
    id?: string;
  },
) {
  const record: LocalInventoryMovement = {
    id: movement.id ?? crypto.randomUUID(),
    organizationId: movement.organizationId,
    productId: movement.productId,
    quantityDelta: movement.quantityDelta,
    movementType: movement.movementType,
    source: movement.source,
    saleLocalId: movement.saleLocalId,
    createdAt: new Date().toISOString(),
    syncStatus: "pending",
  };
  await putInStore("inventory_movements", record);
  return record;
}

export async function getPendingInventoryMovements(organizationId: string) {
  const all = await getAllFromStore<LocalInventoryMovement>(
    "inventory_movements",
  );
  return all.filter(
    (row) =>
      row.organizationId === organizationId && row.syncStatus === "pending",
  );
}
