import Dexie, { type Table } from 'dexie';

export interface OfflineProduct {
  id: string;
  organization_id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface OfflineSale {
  id?: number;
  local_id: string;
  organization_id: string;
  payload: any; // The process_checkout RPC arguments
  status: 'pending' | 'syncing' | 'failed' | 'conflict';
  error?: string;
  created_at: string;
  retry_count: number;
}

export class PosDatabase extends Dexie {
  products!: Table<OfflineProduct>;
  sales_queue!: Table<OfflineSale>;
  categories!: Table<{ id: string, name: string }>;

  constructor() {
    super('KioskPosDB');
    this.version(1).stores({
      products: 'id, name, barcode, sku, category_id, is_active',
      sales_queue: '++id, local_id, status, created_at',
      categories: 'id, name'
    });
  }
}

export const db = new PosDatabase();
