"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  BarChart3,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { LiveActivityFeed } from "@/components/realtime/live-activity-feed";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EnterpriseOverview } from "@/components/dashboard/enterprise-overview";
import { StockTakeReminder } from "@/components/dashboard/stock-take-reminder";

// Performance: Lazy load heavy chart and product list components
const RevenueChart = dynamic(
  () =>
    import("@/components/dashboard/revenue-chart").then(
      (mod) => mod.RevenueChart,
    ),
  {
    loading: () => (
      <Skeleton className="h-[350px] w-full col-span-4 rounded-xl" />
    ),
    ssr: false,
  },
);

const TopProducts = dynamic(
  () =>
    import("@/components/dashboard/top-products").then(
      (mod) => mod.TopProducts,
    ),
  {
    loading: () => (
      <Skeleton className="h-[350px] w-full col-span-3 rounded-xl" />
    ),
    ssr: false,
  },
);

export default function DashboardPage() {
  const { data, isLoading, access } = useAnalytics("month");
  const { activeOrganization } = useActiveOrganization();
  const router = useRouter();
  const connectivityStatus = useConnectivityStore((state) => state.status);
  const isOffline = connectivityStatus === "offline";
  const businessName = activeOrganization?.name;

  // If we are still determining the organization context, show a consistent loading state
  if (access.isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {businessName
              ? `Here's what's happening with ${businessName} today.`
              : "Set up an organization to see today's activity."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <Badge variant="secondary" className="h-9 px-3">
              Offline — showing cached data
            </Badge>
          ) : null}
          <Badge variant="outline" className="h-9 px-3">
            <Clock className="mr-2 h-4 w-4" />
            Last 30 Days
          </Badge>
          <Button
            size="sm"
            onClick={() => {
              if (!activeOrganization) {
                toast.info("Create an organization to start selling.", {
                  action: {
                    label: "Create",
                    onClick: () => router.push("/onboarding"),
                  },
                });
                return;
              }
              router.push("/pos");
            }}
          >
            <span className="inline-flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </span>
          </Button>
        </div>
      </div>

      <StockTakeReminder />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          title="Gross Profit"
          value={formatCurrency(data?.profit.gross || 0)}
          trend={data?.profit.change}
          description="after product cost"
          icon={WalletCards}
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

      <EnterpriseOverview />

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
