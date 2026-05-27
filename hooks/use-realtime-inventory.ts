"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { batchInvalidate } from "@/lib/realtime/query-invalidation";
import { useRealtimeContext } from "@/hooks/use-realtime-context";
import { useCartStore } from "@/store/use-cart-store";
import { useRealtimeStore } from "@/store/use-realtime-store";
import { toast } from "sonner";

type ProductPayload = {
  id: string;
  name: string;
  stock_quantity: number | null;
  is_active: boolean | null;
};

export function useRealtimeInventory() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: context } = useRealtimeContext();
  const orgId = context?.organizationId;
  const addConflict = useRealtimeStore((state) => state.addConflict);
  const setConnectionStatus = useRealtimeStore((state) => state.setConnectionStatus);
  const markSynced = useRealtimeStore((state) => state.markSynced);

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`org:${orgId}:inventory`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const next = payload.new as Partial<ProductPayload>;
          const previous = payload.old as Partial<ProductPayload>;
          const productId = next.id ?? previous.id;
          const cart = useCartStore.getState();
          const cartItem = cart.items.find((item) => item.product_id === productId);

          batchInvalidate(queryClient, ["products", "inventory", "dashboard"]);

          if (cartItem && payload.eventType === "DELETE") {
            cart.removeItem(cartItem.product_id);
            addConflict({
              type: "product",
              title: "Product removed from cart",
              message: `${cartItem.name} was deleted by another user and was removed from the cart.`,
              entityId: cartItem.product_id,
            });
            toast.warning(`${cartItem.name} was removed from your cart.`);
          }

          if (cartItem && payload.eventType === "UPDATE") {
            const stock = Number(next.stock_quantity ?? cartItem.stock_quantity);
            const isActive = next.is_active !== false;

            if (!isActive) {
              cart.removeItem(cartItem.product_id);
              addConflict({
                type: "product",
                title: "Product deactivated",
                message: `${cartItem.name} is no longer active and was removed from the cart.`,
                entityId: cartItem.product_id,
              });
              toast.warning(`${cartItem.name} is no longer available.`);
              return;
            }

            if (stock < cartItem.quantity) {
              cart.updateQuantity(cartItem.product_id, Math.max(0, stock));
              addConflict({
                type: "inventory",
                title: "Cart quantity adjusted",
                message: `${cartItem.name} now has ${stock} in stock. Your cart quantity was adjusted.`,
                entityId: cartItem.product_id,
              });
              toast.warning(`${cartItem.name} stock changed to ${stock}.`);
            }
          }

          markSynced();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_transactions",
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          batchInvalidate(queryClient, ["inventory", "products", "dashboard"]);
          markSynced();
        }
      )
      .subscribe((status) => {
        setConnectionStatus(status === "SUBSCRIBED" ? "connected" : status === "CHANNEL_ERROR" ? "error" : "connecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addConflict, markSynced, orgId, queryClient, setConnectionStatus, supabase]);
}
