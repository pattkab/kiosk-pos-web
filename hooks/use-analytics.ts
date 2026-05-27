"use client";

import { getPresetDateRange } from "@/lib/reports/date-ranges";
import { useReports } from "@/hooks/use-reports";

export function useAnalytics(range: "day" | "week" | "month" | "year" = "month") {
  const preset = range === "day" ? "today" : range === "week" ? "this_week" : "this_month";
  const reports = useReports(getPresetDateRange(preset));

  const isLoading = reports.isLoading || reports.access.isLoading;

  return {
    ...reports,
    isLoading,
    data: {
      revenue: {
        total: reports.data.kpis.total_revenue,
        change: 0,
        chart: reports.data.revenueTrend.map((point) => ({
          name: new Date(point.period).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          value: point.revenue,
        })),
      },
      sales: {
        total: reports.data.kpis.total_sales,
        change: 0,
        chart: reports.data.revenueTrend.map((point) => ({
          name: new Date(point.period).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          value: point.sales_count,
        })),
      },
      inventory: {
        totalValue: reports.data.inventoryValuation.reduce((sum, item) => sum + item.selling_value, 0),
        lowStockCount: reports.data.kpis.low_stock_count,
        expiringCount: reports.data.kpis.expiring_products_count,
      },
      topProducts: reports.data.productPerformance.slice(0, 5).map((product) => ({
        name: product.product_name,
        sales: product.quantity_sold,
        revenue: product.revenue,
      })),
    },
  };
}
