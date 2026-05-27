"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeContext } from "@/hooks/use-realtime-context";
import { batchInvalidate } from "@/lib/realtime/query-invalidation";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { toast } from "sonner";

type SalePayload = {
  id: string;
  total_amount: number;
  sale_status: string;
};

export function useRealtimeSales() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: context } = useRealtimeContext();
  const orgId = context?.organizationId;
  const addActivity = useRealtimeStore((state) => state.addActivity);
  const markSynced = useRealtimeStore((state) => state.markSynced);

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`org:${orgId}:sales`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sales",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const sale = payload.new as SalePayload;
          batchInvalidate(queryClient, ["sales", "dashboard", "reports", "inventory"]);
          addActivity({
            id: `sale-${sale.id}`,
            actor: "Cashier",
            action: "completed a sale",
            entityType: "sale",
            entityId: sale.id,
            createdAt: new Date().toISOString(),
            metadata: { total: sale.total_amount },
          });
          toast.success(`New sale completed: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(sale.total_amount))}`);
          markSynced();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          batchInvalidate(queryClient, ["sales", "reports", "dashboard"]);
          markSynced();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "register_sessions",
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          batchInvalidate(queryClient, ["sessions", "reports", "dashboard"]);
          markSynced();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addActivity, markSynced, orgId, queryClient, supabase]);
}
