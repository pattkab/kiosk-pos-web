"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/use-notification-store";
import { AlertPriority, AlertStatus, OperationalAlertType } from "@/types/notifications";

const types: Array<OperationalAlertType | "all"> = [
  "all",
  "low_stock",
  "expiring_soon",
  "expired",
  "failed_sale",
  "register_discrepancy",
  "inventory_adjustment",
  "user_activity",
  "daily_summary",
  "system",
];
const priorities: Array<AlertPriority | "all"> = ["all", "low", "medium", "high", "critical"];
const statuses: Array<AlertStatus | "all"> = ["all", "open", "acknowledged", "resolved", "archived"];

export function AlertFilters() {
  const { filters, setFilters, resetFilters } = useNotificationStore();

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px_160px_160px_auto]">
      <Input
        className="h-10"
        placeholder="Search alerts"
        value={filters.search}
        onChange={(event) => setFilters({ search: event.target.value })}
      />
      <Select value={filters.type} onValueChange={(type: OperationalAlertType | "all") => setFilters({ type })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {types.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.priority} onValueChange={(priority: AlertPriority | "all") => setFilters({ priority })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(status: AlertStatus | "all") => setFilters({ status })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="secondary" onClick={resetFilters}>Reset</Button>
    </div>
  );
}
