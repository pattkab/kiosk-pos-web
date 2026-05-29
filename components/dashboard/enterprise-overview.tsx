"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  Building2,
  CircleDollarSign,
  ReceiptText,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { getPresetDateRange } from "@/lib/reports/date-ranges";
import { formatCurrency } from "@/lib/utils";
import { useActiveOrganization } from "@/hooks/use-organization";
import type { ReportKpis } from "@/types/reports";

type BranchSummary = {
  id: string;
  name: string;
  currency: string | null;
  role: string;
  kpis: ReportKpis | null;
  error: string | null;
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

export function EnterpriseOverview() {
  const supabase = createClient();
  const { organizations, activeOrganization, switchOrganization } =
    useActiveOrganization();
  const range = useMemo(() => getPresetDateRange("this_month"), []);
  const organizationIds = organizations.map((organization) => organization.id);

  const enterprise = useQuery({
    queryKey: [
      "enterprise-analytics",
      organizationIds,
      range.startDate,
      range.endDate,
    ],
    enabled: organizations.length > 1,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<BranchSummary[]> => {
      const rows = await Promise.all(
        organizations.map(async (organization) => {
          const { data, error } = await supabase
            .rpc("get_report_kpis", {
              p_organization_id: organization.id,
              p_start_date: range.startDate,
              p_end_date: range.endDate,
            })
            .single();

          return {
            id: organization.id,
            name: organization.name,
            currency: organization.currency,
            role: organization.role,
            kpis: error ? null : ((data ?? null) as ReportKpis | null),
            error: error?.message ?? null,
          };
        }),
      );

      return rows;
    },
  });

  if (organizations.length <= 1) return null;

  const summaries = enterprise.data ?? [];
  const currencies = new Set(
    summaries
      .map(
        (summary) => summary.currency || activeOrganization?.currency || "USD",
      )
      .filter(Boolean),
  );
  const aggregateCurrency =
    currencies.size === 1
      ? [...currencies][0]
      : (activeOrganization?.currency ?? "USD");
  const canAggregateMoney = currencies.size <= 1;
  const totals = summaries.reduce(
    (acc, summary) => {
      acc.revenue += summary.kpis?.total_revenue ?? 0;
      acc.grossProfit += summary.kpis?.gross_profit ?? 0;
      acc.sales += summary.kpis?.total_sales ?? 0;
      acc.lowStock += summary.kpis?.low_stock_count ?? 0;
      return acc;
    },
    { revenue: 0, grossProfit: 0, sales: 0, lowStock: 0 },
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Enterprise overview
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare every business or branch you manage for the current month.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {organizations.length} locations
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {enterprise.isLoading ? (
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-md" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Metric
                icon={CircleDollarSign}
                label="Revenue"
                value={
                  canAggregateMoney
                    ? formatCurrency(totals.revenue, aggregateCurrency)
                    : "Mixed"
                }
              />
              <Metric
                icon={WalletCards}
                label="Gross profit"
                value={
                  canAggregateMoney
                    ? formatCurrency(totals.grossProfit, aggregateCurrency)
                    : "Mixed"
                }
              />
              <Metric icon={ReceiptText} label="Sales" value={totals.sales} />
              <Metric
                icon={TriangleAlert}
                label="Low stock"
                value={totals.lowStock}
              />
            </div>

            <div className="overflow-x-auto rounded-md border">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr_auto] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Business or branch</span>
                  <span>Revenue</span>
                  <span>Gross profit</span>
                  <span>Sales</span>
                  <span className="text-right">Switch</span>
                </div>
                <div className="divide-y">
                  {summaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr_auto] items-center gap-3 px-3 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {summary.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {summary.role}
                          {summary.error ? " · analytics unavailable" : ""}
                        </div>
                      </div>
                      <span>
                        {formatCurrency(
                          summary.kpis?.total_revenue ?? 0,
                          summary.currency,
                        )}
                      </span>
                      <span>
                        {formatCurrency(
                          summary.kpis?.gross_profit ?? 0,
                          summary.currency,
                        )}
                      </span>
                      <span>{summary.kpis?.total_sales ?? 0}</span>
                      <button
                        type="button"
                        className="justify-self-end rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                        onClick={() => switchOrganization(summary.id)}
                        disabled={summary.id === activeOrganization?.id}
                        aria-label={`Switch to ${summary.name}`}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
