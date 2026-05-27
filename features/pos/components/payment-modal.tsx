"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCheckout } from "@/hooks/use-pos";
import { useCartStore } from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { CheckoutPayment } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Banknote, CheckCircle2, CreditCard, Delete, Loader2, Plus, Smartphone, SplitSquareHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

type TenderMethod = CheckoutPayment["payment_method"];

const methodOptions: Array<{ value: TenderMethod; label: string; icon: typeof Banknote }> = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "mobile_money", label: "Mobile money", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
];

const makePayment = (method: TenderMethod, amount: number): CheckoutPayment => ({
  id: crypto.randomUUID(),
  payment_method: method,
  amount,
  reference: "",
});

export function PaymentModal() {
  const { isPaymentOpen, closePayment, setReceipt } = useCheckoutStore();
  const { getTotals, clearCart } = useCartStore();
  const checkout = useCheckout();
  const totals = getTotals();
  const [method, setMethod] = useState<TenderMethod>("cash");
  const [amountText, setAmountText] = useState("");
  const [payments, setPayments] = useState<CheckoutPayment[]>([]);
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, totals.total - paid);
  const changeDue = Math.max(0, paid - totals.total);
  const tenderAmount = Number(amountText || 0);
  const canComplete = paid + 0.01 >= totals.total && totals.total > 0;
  const suggestedCash = useMemo(() => {
    const rounded = Math.ceil(totals.total / 5) * 5;
    return Array.from(new Set([totals.total, rounded, rounded + 5, rounded + 10])).slice(0, 4);
  }, [totals.total]);

  useEffect(() => {
    if (isPaymentOpen) {
      setPayments([]);
      setAmountText(totals.total.toFixed(2));
      setMethod("cash");
    }
  }, [isPaymentOpen, totals.total]);

  const appendDigit = (value: string) => {
    if (value === "clear") return setAmountText("");
    if (value === "back") return setAmountText((current) => current.slice(0, -1));
    if (value === "." && amountText.includes(".")) return;
    setAmountText((current) => `${current}${value}`);
  };

  const addPayment = () => {
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
      closePayment();
      toast.success("Sale completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed.");
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
              <div className="mt-2 text-5xl font-black tracking-tight text-primary">{formatCurrency(totals.total)}</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {methodOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={method === option.value ? "default" : "outline"}
                    className="h-20 flex-col gap-2 rounded-lg border-2"
                    onClick={() => setMethod(option.value)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-bold">{option.label}</span>
                  </Button>
                );
              })}
            </div>

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
