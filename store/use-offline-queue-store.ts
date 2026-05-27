import { create } from "zustand";
import { QueueItem, getAllFromStore, putInStore, deleteFromStore } from "@/lib/storage/db";

interface OfflineQueueState {
  items: QueueItem[];
  isSyncing: boolean;
  syncProgress: number; // 0 to 100
  loadQueue: () => Promise<void>;
  enqueueSale: (sale: Omit<QueueItem, "status" | "retryCount">) => Promise<QueueItem>;
  dequeueSale: (id: string) => Promise<void>;
  updateItemStatus: (
    id: string,
    status: QueueItem["status"],
    errorMessage?: string,
    conflictDetails?: any
  ) => Promise<void>;
  incrementRetryCount: (id: string) => Promise<void>;
  setSyncing: (isSyncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  items: [],
  isSyncing: false,
  syncProgress: 0,

  loadQueue: async () => {
    try {
      const items = await getAllFromStore<QueueItem>("queue");
      // Sort items by creation date (FIFO)
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      set({ items });
    } catch (error) {
      console.error("Failed to load offline queue from IndexedDB:", error);
    }
  },

  enqueueSale: async (saleData) => {
    const newItem: QueueItem = {
      ...saleData,
      status: "pending",
      retryCount: 0,
    };

    try {
      await putInStore<QueueItem>("queue", newItem);
      const items = [...get().items, newItem];
      set({ items });
    } catch (error) {
      console.error("Failed to enqueue offline sale to IndexedDB:", error);
    }

    return newItem;
  },

  dequeueSale: async (id) => {
    try {
      await deleteFromStore("queue", id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete queued sale from IndexedDB:", error);
    }
  },

  updateItemStatus: async (id, status, errorMessage, conflictDetails) => {
    const items = get().items;
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    const updatedItem: QueueItem = {
      ...targetItem,
      status,
      errorMessage: errorMessage || undefined,
      conflictDetails: conflictDetails || undefined,
    };

    try {
      await putInStore<QueueItem>("queue", updatedItem);
      set({
        items: items.map((item) => (item.id === id ? updatedItem : item)),
      });
    } catch (error) {
      console.error("Failed to update queued sale status in IndexedDB:", error);
    }
  },

  incrementRetryCount: async (id) => {
    const items = get().items;
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    const updatedItem: QueueItem = {
      ...targetItem,
      retryCount: targetItem.retryCount + 1,
    };

    try {
      await putInStore<QueueItem>("queue", updatedItem);
      set({
        items: items.map((item) => (item.id === id ? updatedItem : item)),
      });
    } catch (error) {
      console.error("Failed to update queued sale retry count in IndexedDB:", error);
    }
  },

  setSyncing: (isSyncing) => set({ isSyncing }),
  setSyncProgress: (syncProgress) => set({ syncProgress }),
}));
