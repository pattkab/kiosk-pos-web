import { z } from "zod";

export const alertTypeSchema = z.enum([
  "low_stock",
  "expiry",
  "failed_transaction",
  "expiring_soon",
  "expired",
  "failed_sale",
  "register_discrepancy",
  "inventory_adjustment",
  "user_activity",
  "daily_summary",
  "system",
]);

export const alertPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const alertStatusSchema = z.enum(["open", "acknowledged", "resolved", "archived"]);

export const notificationPreferencesSchema = z.object({
  enabled_alert_types: z.array(alertTypeSchema).min(1),
  minimum_priority: alertPrioritySchema,
  in_app_enabled: z.boolean(),
  email_enabled: z.boolean(),
  daily_summary_enabled: z.boolean(),
});

export type NotificationPreferencesValues = z.infer<typeof notificationPreferencesSchema>;
