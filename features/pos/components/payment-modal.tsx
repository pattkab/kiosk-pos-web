"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCheckout, useCurrentPosContext } from "@/hooks/use-pos";
import { useCartStore } from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useSessionStore } from "@/store/use-session-store";
import { CheckoutPayment } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Delete,
  Loader2,
  Plus,
  Smartphone,
  SplitSquareHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { YoCollectionPanel } from "@/features/pos/components/yo-collection-panel";
import { useCheckoutPayableTotal } from "@/features/pos/components/loyalty-panel";
import type { YoCollectionMethod } from "@/lib/payments/yo/types";

type TenderMethod = CheckoutPayment["payment_method"] | YoCollectionMethod;

type MethodOption = {
  value: TenderMethod;
  label: string;
  icon: typeof Banknote;
  yo?: boolean;
};

const baseMethodOptions: MethodOption[] = [
  { value: "cash", label: "Cash", icon: Banknote },
];

const yoMethodOptions: MethodOption[] = [
  { value: "mtn_mobile_money", label: "MTN MoMo", icon: Smartphone, yo: true },
  { value: "airtel_money", label: "Airtel Money", icon: Smartphone, yo: true },
  { value: "visa", label: "Visa", icon: CreditCard, yo: true },
  { value: "mastercard", label: "Mastercard", icon: CreditCard, yo: true },
];

const manualDigitalOptions: MethodOption[] = [
  { value: "mobile_money", label: "Mobile money (manual)", icon: Smartphone },
  { value: "card", label: "Card (manual)", icon: CreditCard },
];

const makePayment = (
  method: CheckoutPayment["payment_method"],
  amount: number,
): CheckoutPayment => ({
  id: crypto.randomUUID(),
  payment_method: method,
  amount,
  reference: "",
});

function isYoMethod(method: TenderMethod): method is YoCollectionMethod {
  return (
    method === "mtn_mobile_money" ||
    method === "airtel_money" ||
    method === "visa" ||
    method === "mastercard" ||
    method === "card"
  );
}

export function PaymentModal() {
  const { isPaymentOpen, closePayment, setReceipt, resetCheckout } = useCheckoutStore();
  const { getTotals, clearCart } = useCartStore();
  const { data: posContext } = useCurrentPosContext();
  const currentSession = useSessionStore((state) => state.currentSession);
  const checkout = useCheckout();
  const totals = getTotals();
  const checkoutTotals = useCheckoutPayableTotal(totals.total);
  const amountDue = checkoutTotals.payableTotal;
  const [method, setMethod] = useState<TenderMethod>("cash");
  const [yoEnabled, setYoEnabled] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [payments, setPayments] = useState<CheckoutPayment[]>([]);
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, amountDue - paid);
  const changeDue = Math.max(0, paid - amountDue);
  const tenderAmount = Number(amountText || 0);
  const canComplete = paid + 0.01 >= amountDue && amountDue > 0;
  const suggestedCash = useMemo(() => {
    const rounded = Math.ceil(amountDue / 5) * 5;
    return Array.from(new Set([amountDue, rounded, rounded + 5, rounded + 10])).slice(0, 4);
  }, [amountDue]);

  const methodOptions = useMemo(
    () =>
      yoEnabled
        ? [...baseMethodOptions, ...yoMethodOptions]
        : [...baseMethodOptions, ...manualDigitalOptions],
    [yoEnabled],
  );

  useEffect(() => {
    if (!isPaymentOpen) return;
    fetch("/api/payments/yo/config")
      .then((response) => response.json())
      .then((body) => setYoEnabled(Boolean(body.enabled)))
      .catch(() => setYoEnabled(false));
  }, [isPaymentOpen]);

  useEffect(() => {
    if (isPaymentOpen) {
      setPayments([]);
      setAmountText(amountDue.toFixed(2));
      setMethod("cash");
    }
  }, [amountDue, isPaymentOpen]);

  const yoPanelAmount = Math.max(0, remaining > 0 ? remaining : amountDue);

  const appendDigit = (value: string) => {
    if (value === "clear") return setAmountText("");
    if (value === "back") return setAmountText((current) => current.slice(0, -1));
    if (value === "." && amountText.includes(".")) return;
    setAmountText((current) => `${current}${value}`);
  };

  const addPayment = () => {
    if (isYoMethod(method)) return;
    if (!Number.isFinite(tenderAmount)) {
      toast.error("Enter a valid payment amount.");
      return;
    }
    const amount = method === "cash" ? tenderAmount : Math.min(tenderAmount || remaining, remaining);
    if (amount <= 0) {
      toast.error("Enter a payment amount.");
      return;
    }
    setPayments((current) => [...current, makePayment(method, Number(amount.toFixed(2)))]);
    setAmountText(Math.max(0, remaining - amount).toFixed(2));
  };

  const completeCheckout = async () => {
    try {
      const receipt = await checkout.mutateAsync(payments);
      setReceipt(receipt);
      clearCart();
      resetCheckout();
      closePayment();
      toast.success("Sale completed");
    } catch (error) {
      toast.error(
        getUserErrorMessage(error, "Checkout failed. Please try again."),
      );
    }
  };

  return (
    <Dialog open={isPaymentOpen} onOpenChange={(open) => !open && closePayment()}>
      <DialogContent className="max-w-[920px] overflow-hidden p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <SplitSquareHorizontal className="h-5 w-5" />
            Payment
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-[1fr_390px]">
          <div className="space-y-6 bg-muted/20 p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Amount due</p>
              <div className="mt-2 text-5xl font-black tracking-tight text-primary">{formatCurrency(amountDue)}</div>
              {checkoutTotals.loyaltyDiscount > 0 ? (
                <p className="mt-2 text-sm text-emerald-600">
                  Includes {formatCurrency(checkoutTotals.loyaltyDiscount)} loyalty discount
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {methodOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={method === option.value ? "default" : "outline"}
                    className={cn(
                      "h-[4.5rem] flex-col gap-1.5 rounded-lg border-2 px-2",
                      option.yo && "border-emerald-500/40",
                    )}
                    onClick={() => setMethod(option.value)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-center text-[11px] font-bold leading-tight sm:text-xs">
                      {option.label}
                    </span>
                  </Button>
                );
              })}
            </div>

            {yoEnabled && (
              <p className="text-xs text-muted-foreground">
                MTN, Airtel, Visa, and Mastercard collect via Yo Payments Uganda.
              </p>
            )}

            {isYoMethod(method) && posContext?.organizationId ? (
              <YoCollectionPanel
                method={method}
                amount={yoPanelAmount}
                organizationId={posContext.organizationId}
                registerSessionId={currentSession?.id}
                onCollected={(payment) => {
                  setPayments((current) => [...current, payment]);
                  setMethod("cash");
                  setAmountText(Math.max(0, remaining - payment.amount).toFixed(2));
                }}
                onCancel={() => setMethod("cash")}
              />
            ) : (
              <>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tender amount</Label>
              <div className="flex gap-2">
                <Input
                  className="h-16 text-right text-3xl font-black"
                  inputMode="decimal"
                  value={amountText}
                  onChange={(event) => setAmountText(event.target.value)}
                />
                <Button className="h-16 w-24" onClick={addPayment}>
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">Add tender</span>
                </Button>
              </div>
            </div>

            {method === "cash" && (
              <div className="grid grid-cols-4 gap-2">
                {suggestedCash.map((amount) => (
                  <Button key={amount} variant="secondary" className="h-12 font-bold" onClick={() => setAmountText(amount.toFixed(2))}>
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className={cn("h-14 text-lg font-bold", key === "back" && "text-muted-foreground")}
                  onClick={() => appendDigit(key)}
                >
                  {key === "back" ? <Delete className="h-5 w-5" /> : key}
                </Button>
              ))}
              <Button variant="outline" className="col-span-3 h-12 font-bold text-muted-foreground" onClick={() => appendDigit("clear")}>
                Clear
              </Button>
            </div>
              </>
            )}
          </div>

          <div className="flex flex-col border-l bg-card p-6">
            <div className="space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span>
                <span>{formatCurrency(paid)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Remaining</span>
                <span>{formatCurrency(remaining)}</span>
              </div>
              {changeDue > 0 && (
                <div className="flex justify-between rounded-lg bg-emerald-500/10 p-3 text-emerald-700">
                  <span className="font-bold">Change due</span>
                  <span className="font-black">{formatCurrency(changeDue)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex-1 space-y-3 overflow-y-auto">
              {payments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Add one payment or split the balance across multiple methods.
                </div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold capitalize">{payment.payment_method.replace("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(payment.amount)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setPayments((current) => current.filter((entry) => entry.id !== payment.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      className="mt-3 h-10"
                      placeholder="Reference"
                      value={payment.reference}
                      onChange={(event) =>
                        setPayments((current) =>
                          current.map((entry) =>
                            entry.id === payment.id ? { ...entry, reference: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </div>
                ))
              )}
            </div>

            <Button
              className="mt-5 h-16 text-lg font-black"
              disabled={!canComplete || checkout.isPending}
              onClick={completeCheckout}
            >
              {checkout.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              Complete sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
