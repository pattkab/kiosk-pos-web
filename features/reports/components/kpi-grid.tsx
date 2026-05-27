"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
import { ReportKpis } from "@/types/reports";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  PackageCheck,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

export function KpiGrid({ kpis, loading }: { kpis: ReportKpis; loading?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total revenue" value={formatCurrency(kpis.total_revenue)} icon={TrendingUp} loading={loading} />
      <StatCard title="Gross profit" value={formatCurrency(kpis.gross_profit)} icon={WalletCards} loading={loading} />
      <StatCard title="Sales" value={kpis.total_sales} description="completed transactions" icon={Receipt} loading={loading} />
      <StatCard title="Average order" value={formatCurrency(kpis.average_order_value)} icon={ShoppingCart} loading={loading} />
      <StatCard title="Items sold" value={kpis.total_items_sold} icon={PackageCheck} loading={loading} />
      <StatCard title="Low stock" value={kpis.low_stock_count} icon={AlertTriangle} loading={loading} />
      <StatCard title="Expiring products" value={kpis.expiring_products_count} description="next 30 days" icon={Boxes} loading={loading} />
      <StatCard title="Active cashiers" value={kpis.active_cashiers} icon={Users} loading={loading} />
      <StatCard title="Cash payments" value={formatCurrency(kpis.cash_payments)} icon={Banknote} loading={loading} />
      <StatCard title="Digital payments" value={formatCurrency(kpis.digital_payments)} icon={WalletCards} loading={loading} />
      <StatCard title="Best seller" value={kpis.best_selling_product ?? "No sales"} icon={PackageCheck} loading={loading} />
    </div>
  );
}
