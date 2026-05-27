"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  CashierPerformanceRow,
  InventoryValuationRow,
  PaymentBreakdownRow,
  ProductPerformanceRow,
  RegisterReportRow,
  SaleItemReportRow,
  SalesReportRow,
} from "@/types/reports";
import { ReportDataTable } from "./report-data-table";

export function SalesTable({ rows }: { rows: SalesReportRow[] }) {
  return (
    <ReportDataTable
      title="Sales list"
      filename="sales-report.csv"
      rows={rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: "receipt_number", label: "Receipt" },
        { key: "created_at", label: "Date", render: (row) => new Date(row.created_at as string).toLocaleString() },
        { key: "cashier_name", label: "Cashier" },
        { key: "total_amount", label: "Total", align: "right", render: (row) => formatCurrency(row.total_amount as number) },
        { key: "payment_status", label: "Payment", render: (row) => <Badge>{String(row.payment_status)}</Badge> },
        { key: "sale_status", label: "Status", render: (row) => <Badge variant="secondary">{String(row.sale_status)}</Badge> },
      ]}
    />
  );
}

export function SaleItemsTable({ rows }: { rows: SaleItemReportRow[] }) {
  return (
    <ReportDataTable
      title="Sale items"
      filename="sale-items-report.csv"
      rows={rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: "created_at", label: "Date", render: (row) => new Date(row.created_at as string).toLocaleDateString() },
        { key: "product_name", label: "Product" },
        { key: "quantity", label: "Qty", align: "right" },
        { key: "line_total", label: "Revenue", align: "right", render: (row) => formatCurrency(row.line_total as number) },
        { key: "gross_profit", label: "Profit", align: "right", render: (row) => formatCurrency(row.gross_profit as number) },
      ]}
    />
  );
}

export function ProductPerformanceTable({ rows }: { rows: ProductPerformanceRow[] }) {
  return (
    <ReportDataTable
      title="Product performance"
      filename="product-performance-report.csv"
      rows={rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: "product_name", label: "Product" },
        { key: "quantity_sold", label: "Sold", align: "right" },
        { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue as number) },
        { key: "gross_profit", label: "Profit", align: "right", render: (row) => formatCurrency(row.gross_profit as number) },
        { key: "margin_percent", label: "Margin", align: "right", render: (row) => `${Number(row.margin_percent).toFixed(1)}%` },
      ]}
    />
  );
}

export function InventoryValueTable({ rows }: { rows: InventoryValuationRow[] }) {
  return (
    <ReportDataTable
      title="Inventory value"
      filename="inventory-valuation-report.csv"
      rows={rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: "product_name", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "category_name", label: "Category" },
        { key: "stock_quantity", label: "Stock", align: "right" },
        { key: "cost_value", label: "Cost value", align: "right", render: (row) => formatCurrency(row.cost_value as number) },
        { key: "selling_value", label: "Retail value", align: "right", render: (row) => formatCurrency(row.selling_value as number) },
      ]}
    />
  );
}

export function LowStockTable({ rows }: { rows: InventoryValuationRow[] }) {
  return (
    <ReportDataTable
      title="Low stock products"
      filename="low-stock-report.csv"
      rows={rows.filter((row) => row.stock_quantity <= row.low_stock_threshold) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "product_name", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "stock_quantity", label: "Stock", align: "right" },
        { key: "low_stock_threshold", label: "Threshold", align: "right" },
        { key: "selling_value", label: "Retail value", align: "right", render: (row) => formatCurrency(row.selling_value as number) },
      ]}
    />
  );
}

export function ExpiringProductsTable({ rows }: { rows: InventoryValuationRow[] }) {
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  return (
    <ReportDataTable
      title="Expiring products"
      filename="expiring-products-report.csv"
      rows={
        rows.filter((row) => row.expiry_date && new Date(row.expiry_date) <= soon) as unknown as Record<string, unknown>[]
      }
      columns={[
        { key: "product_name", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "stock_quantity", label: "Stock", align: "right" },
        { key: "expiry_date", label: "Expiry date" },
        { key: "selling_value", label: "Retail value", align: "right", render: (row) => formatCurrency(row.selling_value as number) },
      ]}
    />
  );
}

export function CashierSummaryTable({ rows }: { rows: CashierPerformanceRow[] }) {
  return (
    <ReportDataTable
      title="Cashier summaries"
      filename="cashier-performance-report.csv"
      rows={rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: "cashier_name", label: "Cashier" },
        { key: "sales_count", label: "Sales", align: "right" },
        { key: "revenue", label: "Revenue", align: "right", render: (row) => formatCurrency(row.revenue as number) },
        { key: "average_order_value", label: "AOV", align: "right", render: (row) => formatCurrency(row.average_order_value as number) },
        { key: "gross_profit", label: "Profit", align: "right", render: (row) => formatCurrency(row.gross_profit as number) },
      ]}
    />
  );
}

export function RegisterSessionsTable({ rows }: { rows: RegisterReportRow[] }) {
  return (
    <ReportDataTable
      title="Register sessions"
      filename="register-sessions-report.csv"
      rows={rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: "register_name", label: "Register" },
        { key: "cashier_name", label: "Cashier" },
        { key: "opened_at", label: "Opened", render: (row) => new Date(row.opened_at as string).toLocaleString() },
        { key: "closed_at", label: "Closed", render: (row) => row.closed_at ? new Date(row.closed_at as string).toLocaleString() : "Open" },
        { key: "cash_total", label: "Cash", align: "right", render: (row) => formatCurrency(row.cash_total as number) },
        { key: "discrepancy", label: "Variance", align: "right", render: (row) => formatCurrency((row.discrepancy as number | null) ?? 0) },
      ]}
    />
  );
}

export function PaymentSummaryTable({ rows }: { rows: PaymentBreakdownRow[] }) {
  return (
    <ReportDataTable
      title="Payment summaries"
      filename="payment-summary-report.csv"
      rows={rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: "payment_method", label: "Method", render: (row) => String(row.payment_method).replace("_", " ") },
        { key: "payment_count", label: "Count", align: "right" },
        { key: "total_amount", label: "Amount", align: "right", render: (row) => formatCurrency(row.total_amount as number) },
      ]}
    />
  );
}
