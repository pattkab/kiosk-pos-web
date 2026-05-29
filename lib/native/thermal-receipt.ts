import type { CompletedReceipt } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";

const LINE_WIDTH = 32;

function padLine(left: string, right: string) {
  const space = Math.max(1, LINE_WIDTH - left.length - right.length);
  return `${left}${" ".repeat(space)}${right}`;
}

function center(text: string) {
  if (text.length >= LINE_WIDTH) return text.slice(0, LINE_WIDTH);
  const pad = Math.floor((LINE_WIDTH - text.length) / 2);
  return `${" ".repeat(pad)}${text}`;
}

/** Plain-text receipt for thermal printers, share sheets, and Bluetooth (phase C+). */
export function formatThermalReceipt(receipt: CompletedReceipt): string {
  const lines: string[] = [
    center(receipt.organizationName.toUpperCase()),
  ];

  if (receipt.receiptHeader) {
    lines.push(...receipt.receiptHeader.split("\n").map(center));
  }

  lines.push(
    center(`Receipt ${receipt.receiptNumber}`),
  );

  if (receipt.invoiceNumber) {
    lines.push(center(`Invoice ${receipt.invoiceNumber}`));
  }

  if (receipt.customerName) {
    lines.push(center(`Customer: ${receipt.customerName}`));
  }

  lines.push(
    center(new Date(receipt.createdAt).toLocaleString()),
    center(`Cashier: ${receipt.cashierName}`),
  );

  if (
    receipt.isOfflinePending ||
    receipt.receiptNumber.startsWith("OFF-") ||
    receipt.receiptNumber.startsWith("R-OFF")
  ) {
    lines.push(center("OFFLINE - PENDING SYNC"));
  }

  lines.push("-".repeat(LINE_WIDTH));

  for (const item of receipt.items) {
    lines.push(item.name.slice(0, LINE_WIDTH));
    lines.push(
      padLine(
        ` ${item.quantity} x ${formatCurrency(item.unit_price)}`,
        formatCurrency(item.unit_price * item.quantity),
      ),
    );
    if (item.note) lines.push(`  ${item.note}`);
  }

  lines.push("-".repeat(LINE_WIDTH));
  lines.push(padLine("Subtotal", formatCurrency(receipt.subtotal)));

  if (receipt.discountAmount > 0) {
    lines.push(padLine("Discount", `-${formatCurrency(receipt.discountAmount)}`));
  }

  if ((receipt.loyaltyDiscountAmount ?? 0) > 0) {
    lines.push(
      padLine("Loyalty", `-${formatCurrency(receipt.loyaltyDiscountAmount ?? 0)}`),
    );
  }

  lines.push(
    padLine("Tax", formatCurrency(receipt.taxAmount)),
    padLine("TOTAL", formatCurrency(receipt.totalAmount)),
    "-".repeat(LINE_WIDTH),
  );

  for (const payment of receipt.payments) {
    lines.push(
      padLine(
        payment.payment_method.replace(/_/g, " "),
        formatCurrency(payment.amount),
      ),
    );
  }

  if (receipt.changeDue > 0) {
    lines.push(padLine("Change", formatCurrency(receipt.changeDue)));
  }

  if (receipt.receiptNotes) {
    lines.push("", ...receipt.receiptNotes.split("\n").map(center));
  }

  lines.push("", center(receipt.receiptFooter || "Thank you"), "");

  return lines.join("\n");
}
