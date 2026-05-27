"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReportGuard } from "./report-guard";
import { ReportDateFilter } from "./report-date-filter";
import { KpiGrid } from "./kpi-grid";
import {
  CashierComparisonChart,
  InventoryValuationChart,
  PaymentMethodPieChart,
  ProductPerformanceChart,
  ProfitTrendChart,
  RevenueLineChart,
  SalesBarChart,
} from "./report-charts";
import {
  CashierSummaryTable,
  ExpiringProductsTable,
  InventoryValueTable,
  LowStockTable,
  PaymentSummaryTable,
  ProductPerformanceTable,
  RegisterSessionsTable,
  SaleItemsTable,
  SalesTable,
} from "./report-tables";
import { useReports } from "@/hooks/use-reports";
import { getPresetDateRange } from "@/lib/reports/date-ranges";
import { printReport } from "@/lib/reports/export";
import { BarChart3, Download, Printer } from "lucide-react";

type ReportKind =
  | "overview"
  | "sales"
  | "products"
  | "inventory"
  | "cashiers"
  | "payments"
  | "profit"
  | "registers";

const reportTabs: Array<{ href: string; label: string; kind: ReportKind }> = [
  { href: "/reports", label: "Overview", kind: "overview" },
  { href: "/reports/sales", label: "Sales", kind: "sales" },
  { href: "/reports/products", label: "Products", kind: "products" },
  { href: "/reports/inventory", label: "Inventory", kind: "inventory" },
  { href: "/reports/cashiers", label: "Cashiers", kind: "cashiers" },
  { href: "/reports/payments", label: "Payments", kind: "payments" },
  { href: "/reports/profit", label: "Profit", kind: "profit" },
  { href: "/reports/registers", label: "Registers", kind: "registers" },
];

const titles: Record<ReportKind, { title: string; description: string }> = {
  overview: {
    title: "Reports overview",
    description:
      "A live operating view of revenue, products, payments, and stock.",
  },
  sales: {
    title: "Sales reports",
    description:
      "Transaction history, item movement, taxes, discounts, and sales volume.",
  },
  products: {
    title: "Product reports",
    description: "Product revenue, quantities sold, gross profit, and margins.",
  },
  inventory: {
    title: "Inventory reports",
    description: "Inventory valuation, low stock, and expiry exposure.",
  },
  cashiers: {
    title: "Cashier reports",
    description:
      "Cashier sales totals, average order values, and profit contribution.",
  },
  payments: {
    title: "Payment reports",
    description: "Cash, card, mobile money, and split payment summaries.",
  },
  profit: {
    title: "Profit reports",
    description: "Gross profit trends and product margin analysis.",
  },
  registers: {
    title: "Register reports",
    description:
      "Session opening balances, cash totals, closing counts, and discrepancies.",
  },
};

function LoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[360px] animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}

export function ReportsPage({ kind }: { kind: ReportKind }) {
  const [range, setRange] = useState(getPresetDateRange("this_month"));
  const reports = useReports(range);
  const data = reports.data;
  const meta = titles[kind];

  const showOverview = kind === "overview";

  return (
    <ReportGuard>
      <div className="space-y-6 print:space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
            <p className="mt-1 text-muted-foreground">{meta.description}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
            <ReportDateFilter value={range} onChange={setRange} />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="outline"
                className="h-10 gap-2"
                onClick={printReport}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2"
                onClick={() => printReport()}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
          {reportTabs.map((tab) => (
            <Button
              key={tab.href}
              asChild
              variant={tab.kind === kind ? "default" : "secondary"}
              className="shrink-0"
            >
              <Link href={tab.href}>{tab.label}</Link>
            </Button>
          ))}
        </div>

        {reports.isError && (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="p-4 text-sm text-destructive">
              {reports.error instanceof Error
                ? reports.error.message
                : "Unable to load reports."}
            </CardContent>
          </Card>
        )}

        {(showOverview || kind === "sales" || kind === "profit") && (
          <KpiGrid kpis={data.kpis} loading={reports.isLoading} />
        )}

        {reports.isLoading ? (
          <LoadingState />
        ) : (
          <>
            {showOverview && (
              <>
                <div className="grid gap-4 xl:grid-cols-2">
                  <RevenueLineChart data={data.revenueTrend} />
                  <SalesBarChart data={data.revenueTrend} />
                  <ProductPerformanceChart data={data.productPerformance} />
                  <PaymentMethodPieChart data={data.paymentBreakdown} />
                  <ProfitTrendChart data={data.revenueTrend} />
                  <CashierComparisonChart data={data.cashierPerformance} />
                </div>
                <SalesTable rows={data.sales} />
              </>
            )}

            {kind === "sales" && (
              <>
                <div className="grid gap-4 xl:grid-cols-2">
                  <RevenueLineChart data={data.revenueTrend} />
                  <SalesBarChart data={data.revenueTrend} />
                </div>
                <SalesTable rows={data.sales} />
                <SaleItemsTable rows={data.saleItems} />
              </>
            )}

            {kind === "products" && (
              <>
                <ProductPerformanceChart data={data.productPerformance} />
                <ProductPerformanceTable rows={data.productPerformance} />
                <SaleItemsTable rows={data.saleItems} />
              </>
            )}

            {kind === "inventory" && (
              <>
                <InventoryValuationChart data={data.inventoryValuation} />
                <InventoryValueTable rows={data.inventoryValuation} />
                <LowStockTable rows={data.inventoryValuation} />
                <ExpiringProductsTable rows={data.inventoryValuation} />
              </>
            )}

            {kind === "cashiers" && (
              <>
                <CashierComparisonChart data={data.cashierPerformance} />
                <CashierSummaryTable rows={data.cashierPerformance} />
              </>
            )}

            {kind === "payments" && (
              <>
                <PaymentMethodPieChart data={data.paymentBreakdown} />
                <PaymentSummaryTable rows={data.paymentBreakdown} />
                <SalesTable rows={data.sales} />
              </>
            )}

            {kind === "profit" && (
              <>
                <div className="grid gap-4 xl:grid-cols-2">
                  <ProfitTrendChart data={data.revenueTrend} />
                  <ProductPerformanceChart data={data.productPerformance} />
                </div>
                <ProductPerformanceTable rows={data.productPerformance} />
              </>
            )}

            {kind === "registers" && (
              <>
                <RegisterSessionsTable rows={data.registerSessions} />
                <PaymentSummaryTable rows={data.paymentBreakdown} />
              </>
            )}
          </>
        )}
      </div>
    </ReportGuard>
  );
}
