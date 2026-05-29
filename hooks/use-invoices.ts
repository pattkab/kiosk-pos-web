"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";
import type { InvoiceReportRow } from "@/lib/receipts/sale-receipt";
import type { ReportDateRange } from "@/types/reports";

export function useInvoicesReport(range: ReportDateRange, enabled = true) {
  const supabase = createClient();
  const organizationId = useOrganizationStore(
    (state) => state.activeOrganizationId,
  );

  return useQuery({
    queryKey: ["invoices", organizationId, range.startDate, range.endDate],
    enabled: Boolean(organizationId && enabled),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_invoices_report", {
        p_organization_id: organizationId!,
        p_start_date: range.startDate,
        p_end_date: range.endDate,
        p_limit: 500,
      });
      if (error) throw error;
      return (data ?? []) as InvoiceReportRow[];
    },
  });
}
