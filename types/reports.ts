import { Database } from "@/types/database";

export type ReportPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface ReportDateRange {
  preset: ReportPreset;
  startDate: string;
  endDate: string;
}

export interface ReportKpis {
  total_revenue: number;
  gross_profit: number;
  total_sales: number;
  average_order_value: number;
  total_items_sold: number;
  best_selling_product: string | null;
  low_stock_count: number;
  expiring_products_count: number;
  cash_payments: number;
  digital_payments: number;
  active_cashiers: number;
}

export interface RevenueTrendPoint {
  period: string;
  revenue: number;
  sales_count: number;
  gross_profit: number;
  items_sold: number;
}

export interface ProductPerformanceRow {
  product_id: string | null;
  product_name: string;
  quantity_sold: number;
  revenue: number;
  cost: number;
  gross_profit: number;
  margin_percent: number;
}

export interface PaymentBreakdownRow {
  payment_method: Database["public"]["Enums"]["payment_method"];
  total_amount: number;
  payment_count: number;
}

export interface CashierPerformanceRow {
  cashier_id: string;
  cashier_name: string;
  sales_count: number;
  revenue: number;
  average_order_value: number;
  gross_profit: number;
}

export interface InventoryValuationRow {
  product_id: string;
  product_name: string;
  sku: string | null;
  category_name: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  cost_price: number;
  selling_price: number;
  cost_value: number;
  selling_value: number;
  potential_profit: number;
  expiry_date: string | null;
}

export interface SalesReportRow {
  sale_id: string;
  receipt_number: string | null;
  created_at: string;
  cashier_name: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: string;
  sale_status: string;
}

export interface SaleItemReportRow {
  sale_id: string;
  created_at: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
  gross_profit: number;
}

export interface RegisterReportRow {
  session_id: string;
  register_name: string;
  cashier_name: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  actual_closing_balance: number | null;
  discrepancy: number | null;
  sales_count: number;
  cash_total: number;
  total_revenue: number;
}

export interface ReportsData {
  kpis: ReportKpis;
  revenueTrend: RevenueTrendPoint[];
  productPerformance: ProductPerformanceRow[];
  paymentBreakdown: PaymentBreakdownRow[];
  cashierPerformance: CashierPerformanceRow[];
  inventoryValuation: InventoryValuationRow[];
  sales: SalesReportRow[];
  saleItems: SaleItemReportRow[];
  registerSessions: RegisterReportRow[];
}

export type ReportRole = Database["public"]["Enums"]["user_role"];
