"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeContext } from "@/hooks/use-realtime-context";
import { batchInvalidate } from "@/lib/realtime/query-invalidation";
import { useAppStore } from "@/store/use-app-store";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { toast } from "sonner";
import { useNotificationStore } from "@/store/use-notification-store";

export function useRealtimeNotifications() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: context } = useRealtimeContext();
  const orgId = context?.organizationId;
  const upsertNotification = useRealtimeStore((state) => state.upsertNotification);
  const setNotifications = useRealtimeStore((state) => state.setNotifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const setAcknowledgementAlertId = useNotificationStore((state) => state.setAcknowledgementAlertId);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(
        notificationsQuery.data.map((alert) => ({
          id: alert.id,
          title: alert.title,
          message: alert.message,
          type: alert.type,
          priority: alert.priority,
          read: Boolean(alert.is_read),
          createdAt: alert.created_at ?? new Date().toISOString(),
          resourceId: alert.resource_id,
        }))
      );
    }
  }, [notificationsQuery.data, setNotifications]);

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`org:${orgId}:notifications`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          batchInvalidate(queryClient, ["alerts", "dashboard"]);
          const alert = payload.new as {
            id: string;
            title: string;
            message: string;
            type: "low_stock" | "expiry" | "failed_transaction" | "expiring_soon" | "expired" | "failed_sale" | "register_discrepancy" | "inventory_adjustment" | "user_activity" | "daily_summary" | "system";
            priority: "low" | "medium" | "high" | "critical";
            is_read: boolean | null;
            created_at: string | null;
            resource_id: string | null;
          };

          if (payload.eventType === "DELETE") return;

          upsertNotification({
            id: alert.id,
            title: alert.title,
            message: alert.message,
            type: alert.type,
            read: Boolean(alert.is_read),
            createdAt: alert.created_at ?? new Date().toISOString(),
            resourceId: alert.resource_id,
          });

          if (!alert.is_read && payload.eventType === "INSERT") {
            addNotification({
              id: alert.id,
              title: alert.title,
              message: alert.message,
            type: alert.type === "failed_transaction" ? "error" : "warning",
              read: false,
              createdAt: new Date(alert.created_at ?? new Date()),
            });
            toast.warning(alert.title, { description: alert.message });
            if (alert.priority === "critical") setAcknowledgementAlertId(alert.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          batchInvalidate(queryClient, ["alerts", "dashboard"]);
          if (payload.eventType === "DELETE") return;

          const notification = payload.new as {
            id: string;
            alert_id: string | null;
            title: string;
            message: string;
            type: "low_stock" | "expiry" | "failed_transaction" | "expiring_soon" | "expired" | "failed_sale" | "register_discrepancy" | "inventory_adjustment" | "user_activity" | "daily_summary" | "system";
            priority: "low" | "medium" | "high" | "critical";
            read_at: string | null;
            archived_at: string | null;
            created_at: string | null;
            action_url: string | null;
          };

          if (notification.archived_at) return;

          upsertNotification({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            read: Boolean(notification.read_at),
            createdAt: notification.created_at ?? new Date().toISOString(),
            resourceId: notification.alert_id,
          });

          if (!notification.read_at && payload.eventType === "INSERT") {
            const toastFn = notification.priority === "critical" ? toast.error : notification.priority === "high" ? toast.warning : toast.info;
            toastFn(notification.title, { description: notification.message });
            if (notification.priority === "critical" && notification.alert_id) {
              setAcknowledgementAlertId(notification.alert_id);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          batchInvalidate(queryClient, ["activity"]);
          const log = payload.new as {
            id: string;
            action: string;
            entity_type: string;
            entity_id: string | null;
            created_at: string | null;
            metadata: unknown;
          };
          useRealtimeStore.getState().addActivity({
            id: log.id,
            actor: "Team",
            action: log.action.replaceAll("_", " ").toLowerCase(),
            entityType: log.entity_type,
            entityId: log.entity_id,
            createdAt: log.created_at ?? new Date().toISOString(),
            metadata: log.metadata as never,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification, orgId, queryClient, setAcknowledgementAlertId, supabase, upsertNotification]);

  return notificationsQuery;
}

export function useMarkNotificationRead() {
  const supabase = createClient();
  const markRealtimeRead = useRealtimeStore((state) => state.markNotificationRead);
  const markLocalRead = useAppStore((state) => state.markAsRead);
  const queryClient = useQueryClient();

  return async (id: string) => {
    markRealtimeRead(id);
    markLocalRead(id);
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      const { error: alertError } = await supabase.from("alerts").update({ is_read: true }).eq("id", id);
      if (alertError) {
        toast.error(alertError.message);
        return;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };
}

export function useMarkAllNotificationsRead() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: context } = useRealtimeContext();
  const markAllRealtimeRead = useRealtimeStore((state) => state.markAllNotificationsRead);
  const markAllLocalRead = useAppStore((state) => state.markAllAsRead);

  return async () => {
    if (!context?.organizationId) {
      toast.error("Not signed in.");
      return;
    }

    const profileId = context.profile.id;
    const now = new Date().toISOString();

    markAllRealtimeRead();
    markAllLocalRead();

    const { error: notificationError } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("organization_id", context.organizationId)
      .or(`recipient_id.is.null,recipient_id.eq.${profileId}`)
      .is("read_at", null)
      .is("archived_at", null);
    if (notificationError) {
      toast.error(notificationError.message);
      return;
    }

    const { error: alertError } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("organization_id", context.organizationId)
      .eq("is_read", false);
    if (alertError) {
      toast.error(alertError.message);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    await queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };
}
