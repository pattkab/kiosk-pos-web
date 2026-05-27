import { PosProduct, CompletedReceipt, CartItem, CheckoutPayment } from "@/types/pos";
import { Database } from "@/types/database";

export type Category = Database["public"]["Tables"]["categories"]["Row"];

export interface QueueItem {
  id: string; // Local temporary UUID
  organizationId: string;
  cashierId: string;
  sessionId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    discount_amount: number;
    tax_amount: number;
    line_total: number;
    note?: string;
  }>;
  payments: Array<{
    payment_method: string;
    amount: number;
    reference?: string;
  }>;
  createdAt: string;
  status: "pending" | "syncing" | "synced" | "failed" | "conflict";
  errorMessage?: string;
  conflictDetails?: any;
  retryCount: number;
}

const DB_NAME = "kiosk-pos-offline";
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported on this platform."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;

      // Product Cache Store
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }

      // Categories Cache Store
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id" });
      }

      // Offline Checkout Queue Store
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id" });
      }

      // Completed Local Receipts Store
      if (!db.objectStoreNames.contains("receipts")) {
        db.createObjectStore("receipts", { keyPath: "saleId" });
      }

      // Metadata Cache (reports, settings, sessions)
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    };
  });
}

// Generic Store CRUD helpers
export async function getFromStore<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function putInStore<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Bulk insert helper
export async function bulkPutInStore<T>(storeName: string, values: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const value of values) {
      store.put(value);
    }
  });
}

// Search and catalog retrieval helpers
export async function getOfflineProducts(filters?: {
  search?: string;
  categoryId?: string | null;
}): Promise<PosProduct[]> {
  const products = await getAllFromStore<PosProduct>("products");
  let filtered = products;

  if (filters?.categoryId) {
    filtered = filtered.filter((p) => p.category_id === filters.categoryId);
  }

  if (filters?.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.toLowerCase().includes(term))
    );
  }

  return filtered;
}

// Metadata specific helpers (e.g. Cache dashboard, reports)
export async function getMetadata(key: string): Promise<any | null> {
  try {
    const row = await getFromStore<{ key: string; value: any }>("metadata", key);
    return row ? row.value : null;
  } catch (error) {
    console.error("Failed to read metadata:", error);
    return null;
  }
}

export async function saveMetadata(key: string, value: any): Promise<void> {
  try {
    await putInStore<{ key: string; value: any }>("metadata", { key, value });
  } catch (error) {
    console.error("Failed to write metadata:", error);
  }
}
