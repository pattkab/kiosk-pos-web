import { describe, expect, it, vi, beforeEach } from "vitest";
import { searchOfflineCustomers } from "@/lib/offline/customers";
import {
  listSyncConflicts,
  recordSyncConflict,
  resolveSyncConflict,
} from "@/lib/offline/conflicts";
import { clearSyncedLocalData } from "@/lib/offline/backup";
import type { OfflineCustomer } from "@/types/offline";
import type { QueueItem } from "@/lib/storage/db";

const customers: OfflineCustomer[] = [
  {
    id: "c1",
    organization_id: "org-1",
    full_name: "Jane Doe",
    phone: "+256700000001",
    email: "jane@example.com",
    address: null,
    created_at: null,
    updated_at: null,
  },
  {
    id: "c2",
    organization_id: "org-1",
    full_name: "John Smith",
    phone: null,
    email: null,
    address: null,
    created_at: null,
    updated_at: null,
  },
];

const queue: QueueItem[] = [];
const conflicts = new Map<string, unknown>();

vi.mock("@/lib/storage/db", () => ({
  getAllFromStore: vi.fn(async (store: string) => {
    if (store === "customers") return customers;
    if (store === "queue") return queue;
    if (store === "sync_conflicts") return Array.from(conflicts.values());
    return [];
  }),
  putInStore: vi.fn(async (store: string, value: { id: string }) => {
    if (store === "sync_conflicts") conflicts.set(value.id, value);
  }),
  deleteFromStore: vi.fn(async (store: string, id: string) => {
    if (store === "sync_conflicts") conflicts.delete(id);
  }),
  clearStore: vi.fn(),
}));

vi.mock("@/lib/offline/offline-metadata", () => ({
  getOfflineSettings: vi.fn(async () => ({})),
  updateOfflineSettings: vi.fn(),
}));

describe("offline sync utilities", () => {
  beforeEach(() => {
    queue.length = 0;
    conflicts.clear();
  });

  it("searches customers offline by name or phone", async () => {
    const byName = await searchOfflineCustomers("jane");
    expect(byName).toHaveLength(1);
    expect(byName[0]?.full_name).toBe("Jane Doe");

    const byPhone = await searchOfflineCustomers("256700");
    expect(byPhone[0]?.id).toBe("c1");
  });

  it("records and resolves sync conflicts", async () => {
    const created = await recordSyncConflict({
      entityType: "sale",
      entityLocalId: "sale-1",
      title: "Stock issue",
      message: "Insufficient stock",
    });
    expect(created.resolvedAt).toBeNull();

    const open = await listSyncConflicts();
    expect(open).toHaveLength(1);

    await resolveSyncConflict(created.id);
    const after = await listSyncConflicts();
    expect(after).toHaveLength(0);
  });

  it("blocks clearing synced data when unsynced sales exist", async () => {
    queue.push({
      id: "pending-1",
      organizationId: "org-1",
      cashierId: "cashier-1",
      sessionId: "session-1",
      subtotal: 10,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 10,
      items: [],
      payments: [],
      createdAt: new Date().toISOString(),
      status: "pending",
      retryCount: 0,
    });

    await expect(clearSyncedLocalData()).rejects.toThrow(/unsynced/i);
  });
});
