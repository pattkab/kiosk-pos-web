import { createClient } from "@/lib/supabase/client";
import { getPresetDateRange } from "@/lib/reports/date-ranges";
import { getMetadata, saveMetadata } from "@/lib/storage/db";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useOrganizationStore } from "@/store/use-organization-store";
import { SyncEngine } from "@/lib/offline/sync-engine";
import type { ReportsData } from "@/types/reports";

/**
 * Caches products, categories, dashboard reports, and receipt settings for offline use.
 */
export async function prefetchOfflineEssentials(
  organizationId?: string | null,
) {
  const orgId =
    organizationId ?? useOrganizationStore.getState().activeOrganizationId;
  if (!orgId) return;

  const status = useConnectivityStore.getState().status;
  if (status === "offline") return;

  await SyncEngine.syncProductCatalog();
  await Promise.all([
    prefetchDashboardReports(orgId),
    prefetchReceiptSettings(orgId),
    prefetchOrganizationContext(orgId),
  ]);
}

async function prefetchDashboardReports(organizationId: string) {
  const range = getPresetDateRange("this_month");
  const cacheKey = `reports-${organizationId}-${range.startDate}-${range.endDate}`;
  const existing = await getMetadata(cacheKey);
  if (existing) return;

  const supabase = createClient();
  const args = {
    p_organization_id: organizationId,
    p_start_date: range.startDate,
    p_end_date: range.endDate,
  };

  try {
    const [
      kpis,
      revenueTrend,
      productPerformance,
      paymentBreakdown,
      cashierPerformance,
      inventoryValuation,
    ] = await Promise.all([
      supabase.rpc("get_report_kpis", args).single(),
      supabase.rpc("get_revenue_trend", args),
      supabase.rpc("get_product_performance", { ...args, p_limit: 100 }),
      supabase.rpc("get_payment_breakdown", args),
      supabase.rpc("get_cashier_performance", args),
      supabase.rpc("get_inventory_valuation_report", {
        p_organization_id: organizationId,
      }),
    ]);

    if (kpis.error && revenueTrend.error) return;

    const reportData: ReportsData = {
      kpis: (kpis.data ?? {}) as ReportsData["kpis"],
      revenueTrend: (revenueTrend.data ?? []) as ReportsData["revenueTrend"],
      productPerformance: (productPerformance.data ??
        []) as ReportsData["productPerformance"],
      paymentBreakdown: (paymentBreakdown.data ??
        []) as ReportsData["paymentBreakdown"],
      cashierPerformance: (cashierPerformance.data ??
        []) as ReportsData["cashierPerformance"],
      inventoryValuation: (inventoryValuation.data ??
        []) as ReportsData["inventoryValuation"],
      sales: [],
      saleItems: [],
      registerSessions: [],
    };

    await saveMetadata(cacheKey, reportData);
  } catch (error) {
    console.warn("[prefetchOfflineEssentials] Dashboard cache skipped:", error);
  }
}

async function prefetchReceiptSettings(organizationId: string) {
  const cacheKey = `receipt-settings-${organizationId}`;
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("organization_settings")
      .select("receipt_header, receipt_footer, receipt_notes, tax_rate")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) throw error;
    if (data) await saveMetadata(cacheKey, data);
  } catch (error) {
    console.warn(
      "[prefetchOfflineEssentials] Receipt settings cache skipped:",
      error,
    );
  }
}

async function prefetchOrganizationContext(organizationId: string) {
  const existing = await getMetadata("pos-context");
  if (existing?.organizationId === organizationId) return;

  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("auth_user_id", user.id)
      .single();

    const { data: organizationRows } = await supabase.rpc(
      "list_my_organizations",
    );
    const organization =
      (organizationRows ?? []).find(
        (entry: { id: string }) => entry.id === organizationId,
      ) ?? null;

    if (!profile || !organization) return;

    await saveMetadata("pos-context", {
      profile,
      organization,
      organizationId: organization.id,
      role: organization.role,
    });
  } catch (error) {
    console.warn(
      "[prefetchOfflineEssentials] POS context cache skipped:",
      error,
    );
  }
}
