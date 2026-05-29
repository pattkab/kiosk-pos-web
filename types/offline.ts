import type { Database } from "@/types/database";

export type OfflineCustomer = Database["public"]["Tables"]["customers"]["Row"] & {
  loyalty_card_number?: string;
  loyalty_points?: number;
  profile_id?: string | null;
  status?: string;
};

export interface SyncConflictRecord {
  id: string;
  entityType: "sale" | "customer" | "inventory" | "product";
  entityLocalId: string;
  title: string;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  details?: Record<string, unknown>;
}
