import { Database } from "@/types/database";

export type OfflineCustomer = Database["public"]["Tables"]["customers"]["Row"];

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
