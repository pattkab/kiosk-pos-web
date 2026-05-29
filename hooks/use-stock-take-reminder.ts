"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import { createClient } from "@/lib/supabase/client";
import { getUserErrorMessage } from "@/lib/errors/user-message";

export type StockTakeReminderState = {
  enabled: boolean;
  intervalDays: number;
  lastCompletedAt: string | null;
  nextDueAt: Date;
  daysUntilDue: number;
  isDue: boolean;
  isOverdue: boolean;
};

const DEFAULT_INTERVAL_DAYS = 7;
const DAY_MS = 86_400_000;

function normalizeInterval(days?: number | null) {
  const value = Number(days ?? DEFAULT_INTERVAL_DAYS);
  if (!Number.isFinite(value)) return DEFAULT_INTERVAL_DAYS;
  return Math.min(Math.max(Math.round(value), 1), 365);
}

export function getStockTakeReminderState({
  enabled,
  intervalDays,
  lastCompletedAt,
  organizationCreatedAt,
  now = new Date(),
}: {
  enabled?: boolean | null;
  intervalDays?: number | null;
  lastCompletedAt?: string | null;
  organizationCreatedAt?: string | null;
  now?: Date;
}): StockTakeReminderState {
  const normalizedInterval = normalizeInterval(intervalDays);
  const anchor = lastCompletedAt ?? organizationCreatedAt ?? now.toISOString();
  const anchorDate = Number.isNaN(new Date(anchor).getTime())
    ? now
    : new Date(anchor);
  const nextDueAt = new Date(
    anchorDate.getTime() + normalizedInterval * DAY_MS,
  );
  const rawDaysUntilDue = Math.ceil(
    (nextDueAt.getTime() - now.getTime()) / DAY_MS,
  );

  return {
    enabled: enabled ?? true,
    intervalDays: normalizedInterval,
    lastCompletedAt: lastCompletedAt ?? null,
    nextDueAt,
    daysUntilDue: rawDaysUntilDue,
    isDue: rawDaysUntilDue <= 0,
    isOverdue: rawDaysUntilDue < 0,
  };
}

export function useStockTakeReminder() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const toastKeyRef = useRef<string | null>(null);

  const reminderState = useMemo(
    () =>
      getStockTakeReminderState({
        enabled: settings.data?.stock_take_reminders_enabled ?? true,
        intervalDays:
          settings.data?.stock_take_interval_days ?? DEFAULT_INTERVAL_DAYS,
        lastCompletedAt: settings.data?.stock_take_last_completed_at ?? null,
      }),
    [
      settings.data?.stock_take_interval_days,
      settings.data?.stock_take_last_completed_at,
      settings.data?.stock_take_reminders_enabled,
    ],
  );

  const generateAlert = useMutation({
    mutationFn: async () => {
      if (!activeOrganization) return null;
      const { data, error } = await supabase.rpc(
        "generate_stock_take_reminder",
        {
          p_organization_id: activeOrganization.id,
        },
      );
      if (error) throw error;
      return data as string | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const completeStockTake = useMutation({
    mutationFn: async () => {
      if (!activeOrganization) {
        throw new Error(
          "Select an organization before recording a stock take.",
        );
      }

      const { data, error } = await supabase.rpc("complete_stock_take", {
        p_organization_id: activeOrganization.id,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Stock take recorded", {
        description: "The next reconciliation reminder has been scheduled.",
      });
    },
    onError: (error) =>
      toast.error(
        getUserErrorMessage(error, "We could not record the stock take."),
      ),
  });

  useEffect(() => {
    if (
      !activeOrganization ||
      !reminderState.enabled ||
      !reminderState.isDue ||
      generateAlert.isPending
    ) {
      return;
    }

    const alertKey = `${activeOrganization.id}:${reminderState.nextDueAt.toISOString()}`;
    if (toastKeyRef.current === alertKey) return;

    toastKeyRef.current = alertKey;
    void generateAlert.mutateAsync().catch((error) => {
      toastKeyRef.current = null;
      console.warn("[useStockTakeReminder] Reminder alert failed:", error);
    });

    toast.warning("Stock take due", {
      description: "Reconcile shelf quantities with system inventory.",
    });
  }, [activeOrganization, generateAlert, reminderState]);

  return {
    settings,
    reminderState,
    completeStockTake,
  };
}
