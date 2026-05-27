"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useSessionStore } from "@/store/use-session-store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Receipt,
  ShoppingCart,
  StickyNote,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { PaymentModal } from "./payment-modal";
import { RegisterSession } from "./register-session";
import { ReceiptModal } from "./receipt-modal";

export function CartSidebar() {
  const {
    items,
    cartDiscount,
    removeItem,
    updateQuantity,
    setItemDiscount,
    setCartDiscount,
    setItemNote,
    clearCart,
    getTotals,
  } = useCartStore();
  const { currentSession } = useSessionStore();
  const { openPayment } = useCheckoutStore();
  const [discountValue, setDiscountValue] = useState("");
  const totals = getTotals();
  const orderNumber = useMemo(() => Math.floor(100000 + Math.random() * 900000), []);

  if (!currentSession) {
    return (
      <>
        <RegisterSession />
        <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <Banknote className="mb-4 h-12 w-12 opacity-30" />
          <h3 className="text-lg font-semibold text-foreground">Register locked</h3>
          <p className="text-sm">Open a register session to begin checkout.</p>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="border-b bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-bold">
              <Receipt className="h-4 w-4" />
              Order #{orderNumber}
            </h3>
            <p className="text-xs text-muted-foreground">
              {currentSession.register_name} - {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearCart} className="h-9 text-destructive" disabled={!items.length}>
            Reset
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <ShoppingCart className="mb-4 h-12 w-12 opacity-20" />
          <h3 className="text-lg font-semibold text-foreground">Empty cart</h3>
          <p className="text-sm">Search, tap a product, or scan a barcode to start an order.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3 p-4">
            {items.map((item) => {
              const lineTotal = item.unit_price * item.quantity;

              return (
                <div
                  key={item.product_id}
                  className="rounded-lg border bg-background p-3 shadow-sm animate-in fade-in slide-in-from-right-1"
                >
                  <div className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {item.image_url ? (
                        <Image fill src={item.image_url} alt={item.name} className="object-cover" />
                      ) : (
                        <ShoppingCart className="m-auto h-5 w-5 opacity-20" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unit_price)} - {item.stock_quantity} in stock
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-black">{formatCurrency(lineTotal)}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex h-10 items-center overflow-hidden rounded-full border bg-muted/40">
                          <button
                            className="flex h-10 w-10 items-center justify-center hover:bg-muted"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-9 text-center text-sm font-black">{item.quantity}</span>
                          <button
                            className="flex h-10 w-10 items-center justify-center hover:bg-muted disabled:opacity-40"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_quantity}
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.product_id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_110px] gap-2">
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-10 pl-9 text-sm"
                        placeholder="Item note"
                        value={item.note}
                        onChange={(event) => setItemNote(item.product_id, event.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-10 pl-9 pr-8 text-sm"
                        inputMode="decimal"
                        placeholder="% off"
                        value={item.discount?.type === "percentage" ? String(item.discount.value) : ""}
                        onChange={(event) =>
                          setItemDiscount(
                            item.product_id,
                            event.target.value
                              ? { type: "percentage", value: Number(event.target.value), reason: "Line discount" }
                              : null
                          )
                        }
                      />
                      {item.discount && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setItemDiscount(item.product_id, null)}
                          aria-label="Clear discount"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <div className="border-t bg-muted/30 p-4">
        <div className="mb-3 grid grid-cols-[1fr_120px] items-end gap-2">
          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground">Cart discount</Label>
            <Input
              className="mt-1 h-11"
              inputMode="decimal"
              placeholder="Fixed amount"
              value={discountValue}
              onChange={(event) => {
                setDiscountValue(event.target.value);
                setCartDiscount(
                  event.target.value
                    ? { type: "fixed", value: Number(event.target.value), reason: "Cart discount" }
                    : null
                );
              }}
            />
          </div>
          <Button
            className="h-11"
            variant={cartDiscount ? "default" : "secondary"}
            onClick={() => {
              setDiscountValue("");
              setCartDiscount(null);
            }}
          >
            {cartDiscount ? "Clear" : "No discount"}
          </Button>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className={cn("flex justify-between", totals.discountTotal > 0 ? "text-emerald-600" : "text-muted-foreground")}>
            <span>Discounts</span>
            <span>-{formatCurrency(totals.discountTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>{formatCurrency(totals.taxAmount)}</span>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex items-center justify-between text-2xl font-black">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(totals.total)}</span>
        </div>

        <Button
          className="mt-4 h-16 w-full rounded-lg text-xl font-black shadow-lg shadow-primary/15 active:scale-[0.99]"
          onClick={openPayment}
          disabled={items.length === 0}
        >
          <CreditCard className="mr-2 h-6 w-6" />
          Pay now
        </Button>
      </div>

      <PaymentModal />
      <ReceiptModal />
    </div>
  );
}
