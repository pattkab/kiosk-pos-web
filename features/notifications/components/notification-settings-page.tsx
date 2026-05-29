"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNotificationPreferences } from "@/hooks/use-notifications";
import { AlertPriority, OperationalAlertType } from "@/types/notifications";
import { Loader2 } from "lucide-react";

const alertTypes: OperationalAlertType[] = [
  "low_stock",
  "expiring_soon",
  "expired",
  "failed_sale",
  "register_discrepancy",
  "inventory_adjustment",
  "stock_take",
  "user_activity",
  "daily_summary",
  "system",
];

const alertTypeCopy: Partial<
  Record<OperationalAlertType, { label: string; description: string }>
> = {
  low_stock: {
    label: "Low stock",
    description: "Notify when stock reaches your reorder threshold.",
  },
  expiring_soon: {
    label: "Expiring soon",
    description: "Warn before product expiry dates.",
  },
  expired: {
    label: "Expired",
    description: "Alert when products are already expired.",
  },
  failed_sale: {
    label: "Failed sale",
    description: "Track failed or incomplete checkout attempts.",
  },
  register_discrepancy: {
    label: "Register discrepancy",
    description: "Flag cash count mismatches at register close.",
  },
  inventory_adjustment: {
    label: "Inventory adjustment",
    description: "Notify on stock corrections and manual changes.",
  },
  stock_take: {
    label: "Stock take",
    description: "Remind the team to reconcile shelf counts with inventory.",
  },
  user_activity: {
    label: "User activity",
    description: "Show key operational events from team members.",
  },
  daily_summary: {
    label: "Daily summary",
    description: "Include end-of-day aggregate operating updates.",
  },
  system: {
    label: "System",
    description: "Surface platform and environment health notices.",
  },
};

type PreferenceDraft = {
  enabledTypes: OperationalAlertType[];
  minimumPriority: AlertPriority;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  dailySummaryEnabled: boolean;
};

const defaultDraft: PreferenceDraft = {
  enabledTypes: alertTypes,
  minimumPriority: "low",
  inAppEnabled: true,
  emailEnabled: false,
  dailySummaryEnabled: true,
};

function ToggleButton({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked
          ? "border-primary bg-primary"
          : "border-muted-foreground/20 bg-muted",
        disabled && "cursor-not-allowed opacity-60",
      )}
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
      aria-disabled={disabled}
      disabled={disabled}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
      <span className="sr-only">{checked ? "Enabled" : "Disabled"}</span>
    </button>
  );
}

export function NotificationSettingsPage() {
  const preferences = useNotificationPreferences();
  const [draft, setDraft] = useState<PreferenceDraft>(defaultDraft);
  const [savedSnapshot, setSavedSnapshot] =
    useState<PreferenceDraft>(defaultDraft);

  useEffect(() => {
    const next: PreferenceDraft = preferences.data
      ? {
          enabledTypes: preferences.data.enabled_alert_types,
          minimumPriority: preferences.data.minimum_priority,
          inAppEnabled: preferences.data.in_app_enabled,
          emailEnabled: preferences.data.email_enabled,
          dailySummaryEnabled: preferences.data.daily_summary_enabled,
        }
      : defaultDraft;
    setDraft(next);
    setSavedSnapshot(next);
  }, [preferences.data]);

  const toggleType = (type: OperationalAlertType, enabled: boolean) => {
    setDraft((current) => ({
      ...current,
      enabledTypes: enabled
        ? [...new Set([...current.enabledTypes, type])]
        : current.enabledTypes.filter((entry) => entry !== type),
    }));
  };

  const hasChanges = useMemo(() => {
    const left = {
      ...draft,
      enabledTypes: [...draft.enabledTypes].sort(),
    };
    const right = {
      ...savedSnapshot,
      enabledTypes: [...savedSnapshot.enabledTypes].sort(),
    };
    return JSON.stringify(left) !== JSON.stringify(right);
  }, [draft, savedSnapshot]);

  const isSaving = preferences.save.isPending;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Notification settings
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDraft(savedSnapshot)}
            disabled={isSaving || !hasChanges}
          >
            Reset changes
          </Button>
          <Button
            className="min-w-[160px]"
            onClick={() =>
              preferences.save.mutate({
                enabled_alert_types: draft.enabledTypes,
                minimum_priority: draft.minimumPriority,
                in_app_enabled: draft.inAppEnabled,
                email_enabled: draft.emailEnabled,
                daily_summary_enabled: draft.dailySummaryEnabled,
              })
            }
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save preferences"
            )}
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground">
        Configure how operational alerts are delivered, filtered, and grouped
        for your team.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Delivery channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label>In-app notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show alerts in the bell menu and notifications inbox.
              </p>
            </div>
            <ToggleButton
              checked={draft.inAppEnabled}
              onChange={(value) =>
                setDraft((current) => ({ ...current, inAppEnabled: value }))
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Sends alerts by email when email delivery is configured.
              </p>
            </div>
            <ToggleButton
              checked={draft.emailEnabled}
              onChange={(value) =>
                setDraft((current) => ({ ...current, emailEnabled: value }))
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label>Daily summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive one daily operating summary.
              </p>
            </div>
            <ToggleButton
              checked={draft.dailySummaryEnabled}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  dailySummaryEnabled: value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priority threshold</CardTitle>
        </CardHeader>
        <CardContent className="max-w-xs space-y-2">
          <Label>Minimum priority to notify</Label>
          <Select
            value={draft.minimumPriority}
            onValueChange={(value: AlertPriority) =>
              setDraft((current) => ({ ...current, minimumPriority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["low", "medium", "high", "critical"].map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert categories</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {alertTypes.map((type) => (
            <div
              key={type}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <Label>
                  {alertTypeCopy[type]?.label ?? type.replaceAll("_", " ")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {alertTypeCopy[type]?.description ??
                    `Receive ${type.replaceAll("_", " ")} alerts.`}
                </p>
              </div>
              <ToggleButton
                checked={draft.enabledTypes.includes(type)}
                onChange={(enabled) => toggleType(type, enabled)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        Changes apply to your notification preferences for this organization.
      </div>
    </div>
  );
}
