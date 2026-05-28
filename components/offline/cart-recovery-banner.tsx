"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/use-cart-store";

const RECOVERY_ACK_KEY = "pos-cart-recovery-ack";

export function CartRecoveryBanner() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const acked = sessionStorage.getItem(RECOVERY_ACK_KEY);
    if (!acked) setVisible(true);
  }, [items.length]);

  if (!visible || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold">Recovered unsaved sale</p>
        <p className="text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} restored from this
          device. Continue checkout or discard the cart.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (confirm("Discard the recovered cart?")) {
              clearCart();
              sessionStorage.setItem(RECOVERY_ACK_KEY, "1");
              setVisible(false);
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Discard
        </Button>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            sessionStorage.setItem(RECOVERY_ACK_KEY, "1");
            setVisible(false);
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Continue sale
        </Button>
      </div>
    </div>
  );
}
