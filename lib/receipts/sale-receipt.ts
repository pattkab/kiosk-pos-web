import type { CartItem, CheckoutPayment, CompletedReceipt } from "@/types/pos";

export type SaleReceiptDetailPayload = {
  saleId: string;
  receiptNumber: string;
  invoiceNumber?: string | null;
  invoiceId?: string | null;
  organizationName: string;
  cashierName: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  payments: CheckoutPayment[];
  changeDue: number;
  loyaltyPointsRedeemed?: number;
  loyaltyPointsEarned?: number;
  loyaltyDiscountAmount?: number;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  receiptLogoUrl?: string | null;
  receiptNotes?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
};

export type InvoiceReportRow = {
  invoice_id: string;
  sale_id: string;
  invoice_number: string;
  receipt_number: string | null;
  issued_at: string;
  customer_name: string;
  cashier_name: string;
  total_amount: number;
  status: string;
};

export function mapSaleReceiptDetail(payload: SaleReceiptDetailPayload): CompletedReceipt {
  return {
    saleId: payload.saleId,
    receiptNumber: payload.receiptNumber,
    invoiceNumber: payload.invoiceNumber ?? undefined,
    invoiceId: payload.invoiceId ?? undefined,
    organizationName: payload.organizationName,
    cashierName: payload.cashierName,
    createdAt: payload.createdAt,
    items: payload.items,
    subtotal: Number(payload.subtotal),
    taxAmount: Number(payload.taxAmount),
    discountAmount: Number(payload.discountAmount),
    totalAmount: Number(payload.totalAmount),
    payments: payload.payments,
    changeDue: Number(payload.changeDue ?? 0),
    loyaltyPointsRedeemed: payload.loyaltyPointsRedeemed,
    loyaltyPointsEarned: payload.loyaltyPointsEarned,
    loyaltyDiscountAmount: payload.loyaltyDiscountAmount,
    receiptHeader: payload.receiptHeader,
    receiptFooter: payload.receiptFooter,
    receiptLogoUrl: payload.receiptLogoUrl,
    receiptNotes: payload.receiptNotes,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
  };
}
