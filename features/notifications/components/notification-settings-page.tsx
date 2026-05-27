"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNotificationPreferences } from "@/hooks/use-notifications";
import { AlertPriority, OperationalAlertType } from "@/types/notifications";

const alertTypes: OperationalAlertType[] = [
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

function ToggleButton({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      className={cn(
        "relative h-7 w-12 rounded-full border transition-colors",
        checked ? "bg-primary" : "bg-muted"
      )}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function NotificationSettingsPage() {
  const preferences = useNotificationPreferences();
  const [enabledTypes, setEnabledTypes] = useState<OperationalAlertType[]>(alertTypes);
  const [minimumPriority, setMinimumPriority] = useState<AlertPriority>("low");
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);

  useEffect(() => {
    if (!preferences.data) return;
    setEnabledTypes(preferences.data.enabled_alert_types);
    setMinimumPriority(preferences.data.minimum_priority);
    setInAppEnabled(preferences.data.in_app_enabled);
    setEmailEnabled(preferences.data.email_enabled);
    setDailySummaryEnabled(preferences.data.daily_summary_enabled);
  }, [preferences.data]);

  const toggleType = (type: OperationalAlertType, enabled: boolean) => {
    setEnabledTypes((current) => enabled ? [...new Set([...current, type])] : current.filter((entry) => entry !== type));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification settings</h1>
        <p className="text-muted-foreground">Configure alert types, severity threshold, and delivery preferences.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div><Label>In-app notifications</Label><p className="text-sm text-muted-foreground">Show notifications inside the POS app.</p></div>
            <ToggleButton checked={inAppEnabled} onChange={setInAppEnabled} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div><Label>Email notifications</Label><p className="text-sm text-muted-foreground">Reserved for email delivery integration.</p></div>
            <ToggleButton checked={emailEnabled} onChange={setEmailEnabled} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div><Label>Daily summary</Label><p className="text-sm text-muted-foreground">Receive end-of-day operating summaries.</p></div>
            <ToggleButton checked={dailySummaryEnabled} onChange={setDailySummaryEnabled} />
          </div>
          <div className="max-w-xs space-y-2">
            <Label>Minimum priority</Label>
            <Select value={minimumPriority} onValueChange={(value: AlertPriority) => setMinimumPriority(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "critical"].map((priority) => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alert types</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {alertTypes.map((type) => (
            <div key={type} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="capitalize">{type.replaceAll("_", " ")}</Label>
                <p className="text-xs text-muted-foreground">Receive {type.replaceAll("_", " ")} alerts.</p>
              </div>
              <ToggleButton checked={enabledTypes.includes(type)} onChange={(enabled) => toggleType(type, enabled)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        className="h-11"
        onClick={() => preferences.save.mutate({
          enabled_alert_types: enabledTypes,
          minimum_priority: minimumPriority,
          in_app_enabled: inAppEnabled,
          email_enabled: emailEnabled,
          daily_summary_enabled: dailySummaryEnabled,
        })}
        disabled={preferences.save.isPending}
      >
        Save preferences
      </Button>
    </div>
  );
}
