import { describe, expect, it } from "vitest";
import { mapSaleReceiptDetail } from "@/lib/receipts/sale-receipt";

describe("sale receipt mapping", () => {
  it("maps server receipt payload into CompletedReceipt", () => {
    const receipt = mapSaleReceiptDetail({
      saleId: "sale-1",
      receiptNumber: "R-20260529-ABCD1234",
      invoiceNumber: "INV-20260529-EFGH5678",
      organizationName: "Demo Shop",
      cashierName: "Jane",
      createdAt: "2026-05-29T12:00:00.000Z",
      items: [
        {
          product_id: "prod-1",
          name: "Coffee",
          quantity: 2,
          unit_price: 5000,
          unit_cost: 2000,
          stock_quantity: 0,
          tax_rate: 0.18,
          tax_mode: "exclusive",
          discount: null,
          note: "",
        },
      ],
      subtotal: 10000,
      taxAmount: 1800,
      discountAmount: 0,
      totalAmount: 11800,
      payments: [
        {
          id: "pay-1",
          payment_method: "cash",
          amount: 12000,
          reference: "",
        },
      ],
      changeDue: 200,
    });

    expect(receipt.receiptNumber).toBe("R-20260529-ABCD1234");
    expect(receipt.invoiceNumber).toBe("INV-20260529-EFGH5678");
    expect(receipt.items).toHaveLength(1);
    expect(receipt.changeDue).toBe(200);
  });
});
