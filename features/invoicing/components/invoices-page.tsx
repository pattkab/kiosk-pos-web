"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportDateFilter } from "@/features/reports/components/report-date-filter";
import { ReceiptReprintButton } from "@/features/receipts/components/receipt-reprint-button";
import { useInvoicesReport } from "@/hooks/use-invoices";
import { useOrganizationSettings } from "@/hooks/use-organization";
import { canUseFeature } from "@/lib/billing/plans";
import { formatCurrency } from "@/lib/utils";
import { getPresetDateRange } from "@/lib/reports/date-ranges";
import type { ReportDateRange } from "@/types/reports";
import { FileText, Search } from "lucide-react";

export function InvoicesPage() {
  const settings = useOrganizationSettings();
  const canUseInvoices = canUseFeature(settings.data, "receipts");
  const [range, setRange] = useState<ReportDateRange>(() =>
    getPresetDateRange("this_month"),
  );
  const [search, setSearch] = useState("");
  const invoicesQuery = useInvoicesReport(range, canUseInvoices);

  const invoices = useMemo(() => {
    const rows = invoicesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (invoice) =>
        invoice.invoice_number.toLowerCase().includes(term) ||
        invoice.receipt_number?.toLowerCase().includes(term) ||
        invoice.customer_name.toLowerCase().includes(term) ||
        invoice.cashier_name.toLowerCase().includes(term),
    );
  }, [invoicesQuery.data, search]);

  if (!canUseInvoices) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Invoicing is available on the Starter plan and above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/settings/billing">Upgrade plan</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileText className="h-6 w-6" />
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground">
            Every completed sale gets an invoice. Open or reprint receipts anytime.
          </p>
        </div>
        <ReportDateFilter value={range} onChange={setRange} />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Invoice list</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9 sm:w-[280px]"
              placeholder="Search invoice, receipt, customer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Loading invoices…
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No invoices in this date range.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.invoice_id}>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {invoice.receipt_number ?? "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.issued_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{invoice.cashier_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ReceiptReprintButton saleId={invoice.sale_id} label="Print" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
