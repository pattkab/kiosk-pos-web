"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useCreateCustomer,
  useCustomerLoyaltyHistory,
  useCustomersList,
} from "@/hooks/use-customers";
import { useOrganizationSettings } from "@/hooks/use-organization";
import { canUseFeature } from "@/lib/billing/plans";
import { parseLoyaltySettings } from "@/lib/loyalty/calculations";
import { formatLoyaltyCardNumber } from "@/lib/loyalty/card";
import { InviteCustomerForm } from "@/features/customers/components/invite-customer-form";
import { Gift, Plus, Search, UserRound } from "lucide-react";

export function CustomersPage() {
  const settings = useOrganizationSettings();
  const canUseCustomers = canUseFeature(settings.data, "customerAccounts");
  const canViewHistory = canUseFeature(settings.data, "loyaltyHistory");
  const loyaltySettings = parseLoyaltySettings(settings.data);
  const customersQuery = useCustomersList();
  const createCustomer = useCreateCustomer();
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const historyQuery = useCustomerLoyaltyHistory(
    canViewHistory ? selectedCustomerId : null,
  );

  const customers = useMemo(() => {
    const rows = customersQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (customer) =>
        customer.full_name.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.loyalty_card_number?.toLowerCase().includes(term),
    );
  }, [customersQuery.data, search]);

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  if (!canUseCustomers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Customer accounts are available on the Growth plan and above.
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
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Attach customers at POS to earn and redeem loyalty points.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings/loyalty">Loyalty settings</Link>
        </Button>
      </div>

      <InviteCustomerForm />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Customer list
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search customers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:bg-muted/40"
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <div>
                  <p className="font-medium">{customer.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact info"}
                  </p>
                  {customer.loyalty_card_number ? (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {formatLoyaltyCardNumber(customer.loyalty_card_number)}
                    </p>
                  ) : null}
                </div>
                {loyaltySettings.loyalty_enabled ? (
                  <Badge variant="secondary">
                    {Number(customer.loyalty_points ?? 0).toLocaleString()} pts
                  </Badge>
                ) : null}
              </button>
            ))}
            {customers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No customers yet. Add one below or from POS checkout.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Full name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <Input
                placeholder="Phone (optional)"
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
              />
              <Button
                className="w-full"
                disabled={newName.trim().length < 2 || createCustomer.isPending}
                onClick={() => {
                  void createCustomer
                    .mutateAsync({ full_name: newName.trim(), phone: newPhone })
                    .then((customer) => {
                      setNewName("");
                      setNewPhone("");
                      setSelectedCustomerId(customer.id);
                    });
                }}
              >
                Add customer
              </Button>
            </CardContent>
          </Card>

          {selectedCustomer && canViewHistory && loyaltySettings.loyalty_enabled ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Loyalty history
                </CardTitle>
                <CardDescription>
                  {selectedCustomer.full_name} ·{" "}
                  {Number(selectedCustomer.loyalty_points ?? 0).toLocaleString()} points
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(historyQuery.data ?? []).map((entry) => (
                  <div key={entry.id} className="rounded-lg border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">
                        {entry.transaction_type}
                      </span>
                      <span
                        className={
                          entry.points_delta >= 0
                            ? "font-bold text-emerald-600"
                            : "font-bold text-destructive"
                        }
                      >
                        {entry.points_delta >= 0 ? "+" : ""}
                        {entry.points_delta}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Balance {entry.balance_after} ·{" "}
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                    {entry.note ? (
                      <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>
                    ) : null}
                  </div>
                ))}
                {(historyQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No loyalty activity yet.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
