"use client";

import { useRealtimeInventory } from "@/hooks/use-realtime-inventory";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useRealtimeSales } from "@/hooks/use-realtime-sales";

export function useRealtimeDashboard() {
  useRealtimeInventory();
  useRealtimeSales();
  useRealtimeNotifications();
}

export function useRealtimeAlerts() {
  return useRealtimeNotifications();
}
