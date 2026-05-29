"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useOrganizationSettings } from "@/hooks/use-organization";
import { useCustomerSearch, useCreateCustomer } from "@/hooks/use-customers";
import { searchOfflineCustomers } from "@/lib/offline/customers";
import { OfflineCustomer } from "@/types/offline";
import { canUseFeature } from "@/lib/billing/plans";
import { parseLoyaltySettings } from "@/lib/loyalty/calculations";
import { formatLoyaltyCardNumber } from "@/lib/loyalty/card";
import { UserRound, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type PickerCustomer = OfflineCustomer & { loyalty_points?: number };

export function OfflineCustomerPicker({ disabled }: { disabled?: boolean }) {
  const status = useConnectivityStore((state) => state.status);
  const isOffline = status === "offline";
  const settingsQuery = useOrganizationSettings();
  const canUseCustomers = canUseFeature(settingsQuery.data, "customerAccounts");
  const loyaltySettings = parseLoyaltySettings(settingsQuery.data);
  const {
    selectedCustomerId,
    selectedCustomerName,
    selectedCustomerPoints,
    setSelectedCustomer,
  } = useCheckoutStore();
  const [query, setQuery] = useState("");
  const [offlineResults, setOfflineResults] = useState<PickerCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const onlineSearch = useCustomerSearch(query, !isOffline && canUseCustomers);
  const createCustomer = useCreateCustomer();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const rows = await searchOfflineCustomers(query, 8);
      if (!cancelled) setOfflineResults(rows);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo(() => {
    if (!isOffline && onlineSearch.data?.length) {
      return onlineSearch.data as PickerCustomer[];
    }
    return offlineResults;
  }, [isOffline, offlineResults, onlineSearch.data]);

  if (!canUseCustomers) {
    return null;
  }

  async function handleQuickAdd() {
    const name = query.trim();
    if (name.length < 2) return;
    const customer = await createCustomer.mutateAsync({ full_name: name });
    setSelectedCustomer(
      customer.id,
      customer.full_name,
      Number(customer.loyalty_points ?? 0),
    );
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="space-y-2 border-b px-4 py-3">
      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        Customer {isOffline ? "(offline cache)" : ""}
      </Label>

      {selectedCustomerId ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <div className="min-w-0">
            <span className="font-medium">{selectedCustomerName ?? "Customer"}</span>
            {loyaltySettings.loyalty_enabled ? (
              <div className="mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {selectedCustomerPoints.toLocaleString()} loyalty pts
                </Badge>
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={disabled}
            onClick={() => {
              setSelectedCustomer(null, null, 0);
              setQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative space-y-2">
          <Input
            placeholder="Search name, phone, email, or loyalty card"
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
          />
          {!isOffline && query.trim().length >= 2 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={disabled || createCustomer.isPending}
              onClick={() => void handleQuickAdd()}
            >
              <Plus className="h-4 w-4" />
              Add &quot;{query.trim()}&quot;
            </Button>
          ) : null}
          {open && results.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted",
                  )}
                  onClick={() => {
                    setSelectedCustomer(
                      customer.id,
                      customer.full_name,
                      Number(customer.loyalty_points ?? 0),
                    );
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{customer.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[customer.phone, customer.email]
                      .filter(Boolean)
                      .join(" · ")}
                    {customer.loyalty_card_number
                      ? ` · ${formatLoyaltyCardNumber(customer.loyalty_card_number)}`
                      : ""}
                    {loyaltySettings.loyalty_enabled
                      ? ` · ${Number(customer.loyalty_points ?? 0).toLocaleString()} pts`
                      : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
