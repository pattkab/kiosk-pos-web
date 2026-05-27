"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeContext } from "@/hooks/use-realtime-context";
import {
  AlertFilters,
  NotificationPreference,
  OperationalAlert,
  OperationalAlertType,
  UserNotification,
} from "@/types/notifications";
import { toast } from "sonner";

export function useNotifications() {
  const supabase = createClient();
  const { data: context } = useRealtimeContext();
  const profileId = context?.profile.id;

  return useQuery({
    queryKey: ["notifications", context?.organizationId, profileId],
    enabled: Boolean(context?.organizationId && profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("organization_id", context!.organizationId)
        .or(`recipient_id.is.null,recipient_id.eq.${profileId}`)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as UserNotification[];
    },
  });
}

export function useUnreadNotifications() {
  const notifications = useNotifications();
  return {
    ...notifications,
    unreadCount: (notifications.data ?? []).filter((entry) => !entry.read_at).length,
  };
}

export function useAlerts(filters?: Partial<AlertFilters>) {
  const supabase = createClient();
  const { data: context } = useRealtimeContext();

  return useQuery({
    queryKey: ["alerts", context?.organizationId, filters],
    enabled: Boolean(context?.organizationId),
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select("*")
        .eq("organization_id", context!.organizationId)
        .order("created_at", { ascending: false });

      if (filters?.type && filters.type !== "all") query = query.eq("type", filters.type);
      if (filters?.priority && filters.priority !== "all") query = query.eq("priority", filters.priority);
      if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
      if (filters?.search) {
        const term = filters.search.replaceAll(",", " ");
        query = query.or(`title.ilike.%${term}%,message.ilike.%${term}%`);
      }

      const { data, error } = await query.limit(250);
      if (error) throw error;
      return (data ?? []) as OperationalAlert[];
    },
  });
}

export function useNotificationPreferences() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: context } = useRealtimeContext();

  const query = useQuery({
    queryKey: ["notification-preferences", context?.organizationId, context?.profile.id],
    enabled: Boolean(context?.organizationId && context?.profile.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("organization_id", context!.organizationId)
        .eq("profile_id", context!.profile.id)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationPreference | null;
    },
  });

  const save = useMutation({
    mutationFn: async (values: {
      enabled_alert_types: OperationalAlertType[];
      minimum_priority: "low" | "medium" | "high" | "critical";
      in_app_enabled: boolean;
      email_enabled: boolean;
      daily_summary_enabled: boolean;
    }) => {
      if (!context) throw new Error("Not signed in.");
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert({
          organization_id: context.organizationId,
          profile_id: context.profile.id,
          ...values,
        }, { onConflict: "organization_id,profile_id" })
        .select()
        .single();
      if (error) throw error;
      return data as NotificationPreference;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences saved");
    },
    onError: (error) => toast.error(error.message),
  });

  return { ...query, save };
}

export function useAcknowledgeAlert() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error: alertError } = await supabase
        .from("alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          is_read: true,
        })
        .eq("id", alertId);
      if (alertError) throw alertError;

      const { error: notificationError } = await supabase
        .from("notifications")
        .update({
          acknowledged_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
        })
        .eq("alert_id", alertId);
      if (notificationError) throw notificationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useNotificationActions() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const archiveAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ status: "archived", archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return { markRead, markAllRead, archive, archiveAlert };
}
