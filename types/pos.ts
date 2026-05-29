import { Database } from "@/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
export type RegisterSessionRow = Database["public"]["Tables"]["register_sessions"]["Row"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export type PosProduct = ProductRow & {
  categories?: Pick<CategoryRow, "name"> | null;
};

export type DiscountType = "percentage" | "fixed";
export type TaxMode = "exclusive" | "inclusive";

export interface AppliedDiscount {
  type: DiscountType;
  value: number;
  reason?: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  stock_quantity: number;
  tax_rate: number;
  tax_mode: TaxMode;
  discount: AppliedDiscount | null;
  note: string;
  sku?: string | null;
  barcode?: string | null;
  image_url?: string | null;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxableSubtotal: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

export interface CheckoutPayment {
  id: string;
  payment_method: Exclude<PaymentMethod, "split">;
  amount: number;
  reference: string;
}

export interface CompletedReceipt {
  saleId: string;
  receiptNumber: string;
  isOfflinePending?: boolean;
  remoteSaleId?: string | null;
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
}

export interface ActiveRegisterSession {
  id: string;
  register_id: string;
  register_name: string;
  opened_at: string;
  opening_balance: number;
  cashier_id: string;
  organization_id: string;
}
