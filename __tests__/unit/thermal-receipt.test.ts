import { describe, expect, it } from "vitest";
import { formatThermalReceipt } from "@/lib/native/thermal-receipt";
import type { CompletedReceipt } from "@/types/pos";

const sampleReceipt: CompletedReceipt = {
  saleId: "sale-1",
  receiptNumber: "R-TEST1234",
  organizationName: "Demo Shop",
  cashierName: "Jane",
  createdAt: "2026-05-29T12:00:00.000Z",
  items: [
    {
      product_id: "p1",
      name: "Coffee",
      quantity: 2,
      unit_price: 5000,
      unit_cost: 2000,
      stock_quantity: 10,
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
    { id: "pay-1", payment_method: "cash", amount: 12000, reference: "" },
  ],
  changeDue: 200,
  receiptFooter: "Karibu tena",
};

describe("formatThermalReceipt", () => {
  it("includes org name, total, and footer", () => {
    const text = formatThermalReceipt(sampleReceipt);
    expect(text).toContain("DEMO SHOP");
    expect(text).toContain("R-TEST1234");
    expect(text).toContain("TOTAL");
    expect(text).toContain("Karibu tena");
    expect(text).toContain("Change");
  });
});
