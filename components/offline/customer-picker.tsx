"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { searchOfflineCustomers } from "@/lib/offline/customers";
import { OfflineCustomer } from "@/types/offline";
import { UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineCustomerPicker({ disabled }: { disabled?: boolean }) {
  const status = useConnectivityStore((state) => state.status);
  const isOffline = status === "offline";
  const { selectedCustomerId, selectedCustomerName, setSelectedCustomer } =
    useCheckoutStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OfflineCustomer[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const rows = await searchOfflineCustomers(query, 8);
      if (!cancelled) setResults(rows);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="space-y-2 border-b px-4 py-3">
      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        Customer {isOffline ? "(offline cache)" : ""}
      </Label>

      {selectedCustomerId ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span className="font-medium">{selectedCustomerName ?? "Customer"}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={disabled}
            onClick={() => {
              setSelectedCustomer(null, null);
              setQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder="Search name, phone, or email"
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
          />
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
                    setSelectedCustomer(customer.id, customer.full_name);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{customer.full_name}</span>
                  {(customer.phone || customer.email) && (
                    <span className="text-xs text-muted-foreground">
                      {[customer.phone, customer.email].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
