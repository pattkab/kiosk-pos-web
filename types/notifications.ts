import { Database, Json } from "@/types/database";

export type OperationalAlertType = Database["public"]["Enums"]["alert_type"];
export type AlertPriority = Database["public"]["Enums"]["alert_priority"];
export type AlertStatus = Database["public"]["Enums"]["alert_status"];

export interface OperationalAlert {
  id: string;
  organization_id: string;
  type: OperationalAlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  message: string;
  resource_id: string | null;
  is_read: boolean | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  archived_at: string | null;
  due_at?: string | null;
  action_url: string | null;
  metadata: Json;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserNotification {
  id: string;
  organization_id: string;
  alert_id: string | null;
  recipient_id: string | null;
  type: OperationalAlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Json;
  read_at: string | null;
  archived_at: string | null;
  acknowledged_at: string | null;
  created_at: string | null;
}

export interface NotificationPreference {
  id: string;
  organization_id: string;
  profile_id: string;
  enabled_alert_types: OperationalAlertType[];
  minimum_priority: AlertPriority;
  in_app_enabled: boolean;
  email_enabled: boolean;
  daily_summary_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AlertFilters {
  type: OperationalAlertType | "all";
  priority: AlertPriority | "all";
  status: AlertStatus | "all";
  search: string;
}
