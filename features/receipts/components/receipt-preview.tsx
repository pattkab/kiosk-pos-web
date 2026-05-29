"use client";

import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { ReceiptText } from "lucide-react";
import type { CompletedReceipt } from "@/types/pos";

export function ReceiptPreview({ receipt }: { receipt: CompletedReceipt }) {
  return (
    <div className="mx-auto w-full max-w-[320px] bg-white p-5 font-mono text-sm text-black shadow-sm print:shadow-none">
      <div className="text-center">
        {receipt.receiptLogoUrl ? (
          <div className="mb-2 flex justify-center">
            <Image
              src={receipt.receiptLogoUrl}
              alt="Company logo"
              width={64}
              height={64}
              className="h-16 w-16 rounded object-contain"
            />
          </div>
        ) : null}
        <ReceiptText className="mx-auto mb-2 h-7 w-7" />
        <h2 className="text-base font-bold uppercase">{receipt.organizationName}</h2>
        {receipt.receiptHeader ? (
          <p className="mt-1 whitespace-pre-line text-xs">{receipt.receiptHeader}</p>
        ) : null}
        {receipt.invoiceNumber ? (
          <p className="text-xs font-bold">Invoice {receipt.invoiceNumber}</p>
        ) : null}
        <p className="text-xs">Receipt {receipt.receiptNumber}</p>
        {receipt.isOfflinePending ||
        receipt.receiptNumber.startsWith("OFF-") ||
        receipt.receiptNumber.startsWith("R-OFF") ? (
          <div className="my-2 inline-block rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
            Offline receipt — pending cloud sync
          </div>
        ) : null}
        <p className="text-xs">{new Date(receipt.createdAt).toLocaleString()}</p>
        <p className="text-xs">Cashier: {receipt.cashierName}</p>
        {receipt.customerName ? (
          <p className="text-xs">Customer: {receipt.customerName}</p>
        ) : null}
      </div>

      <Separator className="my-4 bg-black/20" />

      <div className="space-y-3">
        {receipt.items.map((item) => (
          <div key={`${item.product_id}-${item.note}`}>
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
        {receipt.discountAmount > 0 ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(receipt.discountAmount)}</span>
          </div>
        ) : null}
        {(receipt.loyaltyDiscountAmount ?? 0) > 0 ? (
          <div className="flex justify-between text-emerald-700">
            <span>Loyalty</span>
            <span>-{formatCurrency(receipt.loyaltyDiscountAmount ?? 0)}</span>
          </div>
        ) : null}
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
        {receipt.changeDue > 0 ? (
          <div className="flex justify-between font-bold">
            <span>Change</span>
            <span>{formatCurrency(receipt.changeDue)}</span>
          </div>
        ) : null}
        {(receipt.loyaltyPointsEarned ?? 0) > 0 ? (
          <div className="flex justify-between text-emerald-700">
            <span>Points earned</span>
            <span>+{receipt.loyaltyPointsEarned}</span>
          </div>
        ) : null}
        {(receipt.loyaltyPointsRedeemed ?? 0) > 0 ? (
          <div className="flex justify-between">
            <span>Points redeemed</span>
            <span>-{receipt.loyaltyPointsRedeemed}</span>
          </div>
        ) : null}
      </div>

      {receipt.receiptNotes ? (
        <p className="mt-4 text-center text-[11px] whitespace-pre-line">
          {receipt.receiptNotes}
        </p>
      ) : null}
      <p className="mt-3 text-center text-xs uppercase tracking-wide">
        {receipt.receiptFooter || "Thank you"}
      </p>
    </div>
  );
}
