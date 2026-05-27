"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useCurrentPosContext } from "@/hooks/use-pos";
import { getMetadata, saveMetadata } from "@/lib/storage/db";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import {
  CashierPerformanceRow,
  InventoryValuationRow,
  PaymentBreakdownRow,
  ProductPerformanceRow,
  RegisterReportRow,
  ReportDateRange,
  ReportKpis,
  ReportsData,
  RevenueTrendPoint,
  SaleItemReportRow,
  SalesReportRow,
} from "@/types/reports";

const emptyKpis: ReportKpis = {
  total_revenue: 0,
  gross_profit: 0,
  total_sales: 0,
  average_order_value: 0,
  total_items_sold: 0,
  best_selling_product: null,
  low_stock_count: 0,
  expiring_products_count: 0,
  cash_payments: 0,
  digital_payments: 0,
  active_cashiers: 0,
};

export function useReportAccess() {
  const context = useCurrentPosContext();
  const canViewReports = Boolean(
    context.data?.role && ["owner", "admin", "manager"].includes(context.data.role)
  );

  return {
    ...context,
    canViewReports,
  };
}

export function useReports(range: ReportDateRange) {
  const supabase = createClient();
  const access = useReportAccess();
  const orgId = access.data?.organizationId;

  const query = useQuery({
    queryKey: ["reports", orgId, range.startDate, range.endDate],
    enabled: Boolean(orgId && access.canViewReports),
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ReportsData> => {
      const cacheKey = `reports-${orgId}-${range.startDate}-${range.endDate}`;
      const isOnline = useConnectivityStore.getState().status !== "offline";

      if (!isOnline) {
        console.log("[useReports] Device offline: loading reports from IndexedDB cache.");
        const cached = await getMetadata(cacheKey);
        if (cached) return cached;
        throw new Error("Report metrics are not cached offline for this date range.");
      }

      try {
        const args = {
          p_organization_id: orgId,
          p_start_date: range.startDate,
          p_end_date: range.endDate,
        };

        const [
          kpis,
          revenueTrend,
          productPerformance,
          paymentBreakdown,
          cashierPerformance,
          inventoryValuation,
          sales,
          saleItems,
          registerSessions,
        ] = await Promise.all([
          supabase.rpc("get_report_kpis", args).single(),
          supabase.rpc("get_revenue_trend", args),
          supabase.rpc("get_product_performance", { ...args, p_limit: 100 }),
          supabase.rpc("get_payment_breakdown", args),
          supabase.rpc("get_cashier_performance", args),
          supabase.rpc("get_inventory_valuation_report", { p_organization_id: orgId }),
          supabase.rpc("get_sales_report", { ...args, p_limit: 500 }),
          supabase.rpc("get_sale_items_report", { ...args, p_limit: 1000 }),
          supabase.rpc("get_register_sessions_report", args),
        ]);

        const rpcErrors = [
          { name: "get_report_kpis", error: kpis.error },
          { name: "get_revenue_trend", error: revenueTrend.error },
          { name: "get_product_performance", error: productPerformance.error },
          { name: "get_payment_breakdown", error: paymentBreakdown.error },
          { name: "get_cashier_performance", error: cashierPerformance.error },
          { name: "get_inventory_valuation_report", error: inventoryValuation.error },
          { name: "get_sales_report", error: sales.error },
          { name: "get_sale_items_report", error: saleItems.error },
          { name: "get_register_sessions_report", error: registerSessions.error },
        ].filter((entry) => Boolean(entry.error));

        // Keep reports usable when one RPC fails (e.g. schema drift in a non-active tab).
        if (rpcErrors.length > 0) {
          console.warn(
            "[useReports] Partial report RPC failure(s):",
            rpcErrors.map(({ name, error }) => ({
              rpc: name,
              message: error?.message ?? String(error),
            }))
          );
        }
        if (rpcErrors.length === 9) {
          throw rpcErrors[0].error;
        }

        const reportData: ReportsData = {
          kpis: (kpis.data ?? emptyKpis) as ReportKpis,
          revenueTrend: (revenueTrend.data ?? []) as RevenueTrendPoint[],
          productPerformance: (productPerformance.data ?? []) as ProductPerformanceRow[],
          paymentBreakdown: (paymentBreakdown.data ?? []) as PaymentBreakdownRow[],
          cashierPerformance: (cashierPerformance.data ?? []) as CashierPerformanceRow[],
          inventoryValuation: (inventoryValuation.data ?? []) as InventoryValuationRow[],
          sales: (sales.data ?? []) as SalesReportRow[],
          saleItems: (saleItems.data ?? []) as SaleItemReportRow[],
          registerSessions: (registerSessions.data ?? []) as RegisterReportRow[],
        };

        // Cache reporting data
        await saveMetadata(cacheKey, reportData);

        return reportData;
      } catch (error) {
        console.warn("[useReports] Online fetch failed, trying local metadata cache:", error);
        const cached = await getMetadata(cacheKey);
        if (cached) return cached;
        throw error;
      }
    },
  });

  return useMemo(
    () => ({
      ...query,
      access,
      data: query.data ?? {
        kpis: emptyKpis,
        revenueTrend: [],
        productPerformance: [],
        paymentBreakdown: [],
        cashierPerformance: [],
        inventoryValuation: [],
        sales: [],
        saleItems: [],
        registerSessions: [],
      },
    }),
    [access, query]
  );
}
