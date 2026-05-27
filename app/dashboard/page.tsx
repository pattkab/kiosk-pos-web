"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  BarChart3,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { LiveActivityFeed } from "@/components/realtime/live-activity-feed";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Performance: Lazy load heavy chart and product list components
const RevenueChart = dynamic(() => import("@/components/dashboard/revenue-chart").then(mod => mod.RevenueChart), {
  loading: () => <Skeleton className="h-[350px] w-full col-span-4 rounded-xl" />,
  ssr: false
});

const TopProducts = dynamic(() => import("@/components/dashboard/top-products").then(mod => mod.TopProducts), {
  loading: () => <Skeleton className="h-[350px] w-full col-span-3 rounded-xl" />,
  ssr: false
});

export default function DashboardPage() {
  const { data, isLoading } = useAnalytics('month');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-9 px-3">
            <Clock className="mr-2 h-4 w-4" />
            Last 30 Days
          </Badge>
          <Button size="sm" asChild>
            <Link href="/pos">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data?.revenue.total || 0)}
          trend={data?.revenue.change}
          description="vs last month"
          icon={BarChart3}
          loading={isLoading}
        />
        <StatCard
          title="Sales Volume"
          value={data?.sales.total || 0}
          trend={data?.sales.change}
          description="transactions"
          icon={ShoppingCart}
          loading={isLoading}
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(data?.inventory.totalValue || 0)}
          description="Current stock value"
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          title="Low Stock"
          value={data?.inventory.lowStockCount || 0}
          description="Items need attention"
          icon={AlertTriangle}
          trend={-2} // Example trend
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart data={data?.revenue.chart || []} loading={isLoading} />
        <TopProducts products={data?.topProducts || []} loading={isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <LiveActivityFeed />
      </div>
    </div>
  );
}
