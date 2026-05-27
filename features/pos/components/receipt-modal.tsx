"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Printer, ReceiptText } from "lucide-react";

export function ReceiptModal() {
  const { receipt, isReceiptOpen, closeReceipt } = useCheckoutStore();

  if (!receipt) return null;

  return (
    <Dialog open={isReceiptOpen} onOpenChange={(open) => !open && closeReceipt()}>
      <DialogContent className="max-w-[440px] p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Sale complete
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto p-5">
          <div className="mx-auto w-full max-w-[320px] bg-white p-5 font-mono text-sm text-black shadow-sm print:shadow-none">
            <div className="text-center">
              <ReceiptText className="mx-auto mb-2 h-7 w-7" />
              <h2 className="text-base font-bold uppercase">{receipt.organizationName}</h2>
              <p className="text-xs">Receipt {receipt.receiptNumber}</p>
              {receipt.receiptNumber.startsWith("R-OFF") && (
                <div className="my-2 inline-block rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Queued Offline Sale
                </div>
              )}
              <p className="text-xs">{new Date(receipt.createdAt).toLocaleString()}</p>
              <p className="text-xs">Cashier: {receipt.cashierName}</p>
            </div>

            <Separator className="my-4 bg-black/20" />

            <div className="space-y-3">
              {receipt.items.map((item) => (
                <div key={item.product_id}>
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{item.name}</span>
                    <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                  <div className="text-xs text-black/60">
                    {item.quantity} x {formatCurrency(item.unit_price)}
                    {item.note ? ` - ${item.note}` : ""}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4 bg-black/20" />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
              </div>
              {receipt.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrency(receipt.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(receipt.taxAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(receipt.totalAmount)}</span>
              </div>
            </div>

            <Separator className="my-4 bg-black/20" />

            <div className="space-y-1">
              {receipt.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between capitalize">
                  <span>{payment.payment_method.replace("_", " ")}</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
              ))}
              {receipt.changeDue > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Change</span>
                  <span>{formatCurrency(receipt.changeDue)}</span>
                </div>
              )}
            </div>

            <p className="mt-5 text-center text-xs uppercase tracking-wide">Thank you</p>
          </div>
        </div>

        <div className="flex gap-3 border-t p-5">
          <Button className="h-12 flex-1 gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button className="h-12 flex-1" variant="secondary" onClick={closeReceipt}>
            New sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
