import { Database } from "@/types/database";

export type RealtimeConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";
export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface OnlineUser {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  currentPage: string;
  activity: string;
  onlineAt: string;
}

export interface RealtimeConflict {
  id: string;
  type: "inventory" | "product" | "checkout" | "session";
  title: string;
  message: string;
  entityId?: string;
  createdAt: string;
  resolved: boolean;
}

export interface LiveActivity {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  metadata?: Database["public"]["Tables"]["activity_logs"]["Row"]["metadata"];
}

export interface ActiveRealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: Database["public"]["Enums"]["alert_type"] | "activity" | "register";
  priority?: Database["public"]["Enums"]["alert_priority"];
  read: boolean;
  createdAt: string;
  resourceId?: string | null;
}
