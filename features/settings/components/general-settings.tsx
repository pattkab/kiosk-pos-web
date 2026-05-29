"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import {
  organizationProfileSchema,
  OrganizationProfileValues,
} from "@/validators/organization";
import { businessTypes, normalizeBusinessType } from "@/lib/business-types";
import {
  getStockTakeReminderState,
  useStockTakeReminder,
} from "@/hooks/use-stock-take-reminder";
import { BellRing, CalendarCheck2, ClipboardCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GeneralSettings() {
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const { completeStockTake } = useStockTakeReminder();
  const [stockIntervalDays, setStockIntervalDays] = useState("7");
  const [stockRemindersEnabled, setStockRemindersEnabled] = useState(true);
  const form = useForm<OrganizationProfileValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: "",
      slug: "",
      business_type: "other",
      logo_url: "",
      currency: "USD",
      timezone: "UTC",
      address: "",
      phone: "",
      email: "",
      tax_id: "",
    },
  });

  useEffect(() => {
    if (activeOrganization) {
      form.reset({
        name: activeOrganization.name,
        slug: activeOrganization.slug,
        business_type: normalizeBusinessType(activeOrganization.business_type),
        logo_url: activeOrganization.logo_url ?? "",
        currency: activeOrganization.currency ?? "USD",
        timezone: activeOrganization.timezone ?? "UTC",
        address: activeOrganization.address ?? "",
        phone: activeOrganization.phone ?? "",
        email: activeOrganization.email ?? "",
        tax_id: activeOrganization.tax_id ?? "",
      });
    }
  }, [activeOrganization, form]);

  useEffect(() => {
    if (!settings.data) return;
    setStockIntervalDays(
      String(Number(settings.data.stock_take_interval_days ?? 7)),
    );
    setStockRemindersEnabled(
      settings.data.stock_take_reminders_enabled ?? true,
    );
  }, [settings.data]);

  const stockReminderPreview = useMemo(
    () =>
      getStockTakeReminderState({
        enabled: stockRemindersEnabled,
        intervalDays: Number(stockIntervalDays),
        lastCompletedAt: settings.data?.stock_take_last_completed_at ?? null,
      }),
    [
      settings.data?.stock_take_last_completed_at,
      stockIntervalDays,
      stockRemindersEnabled,
    ],
  );

  const saveStockReminderSettings = () => {
    settings.updateSettings.mutate({
      stock_take_reminders_enabled: stockRemindersEnabled,
      stock_take_interval_days: stockReminderPreview.intervalDays,
      stock_take_last_completed_at:
        settings.data?.stock_take_last_completed_at ?? null,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit((values) =>
              settings.updateProfile.mutate(values),
            )}
          >
            <div className="space-y-2">
              <Label>Business type</Label>
              <Select
                value={form.watch("business_type")}
                onValueChange={(value) =>
                  form.setValue(
                    "business_type",
                    value as OrganizationProfileValues["business_type"],
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {[
              ["name", "Name"],
              ["slug", "Slug"],
              ["currency", "Currency"],
              ["timezone", "Timezone"],
              ["address", "Address"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["tax_id", "Tax ID"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  {...form.register(name as keyof OrganizationProfileValues)}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <Button disabled={settings.updateProfile.isPending}>
                Save organization
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Stock reconciliation reminders
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set how often the team should count shelf stock and reconcile it
            with system inventory.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center justify-between gap-4 rounded-md border p-3">
            <span>
              <span className="block text-sm font-medium">
                Enable stock-taking alerts
              </span>
              <span className="block text-xs text-muted-foreground">
                Dashboard and notification alerts appear when reconciliation is
                due.
              </span>
            </span>
            <input
              type="checkbox"
              checked={stockRemindersEnabled}
              onChange={(event) =>
                setStockRemindersEnabled(event.target.checked)
              }
              className="h-5 w-5 rounded border-muted-foreground/40 accent-primary"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="stock-take-interval">Reminder interval</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stock-take-interval"
                  type="number"
                  min={1}
                  max={365}
                  value={stockIntervalDays}
                  onChange={(event) => setStockIntervalDays(event.target.value)}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <CalendarCheck2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {stockReminderPreview.enabled
                      ? stockReminderPreview.isDue
                        ? "Reconciliation is due now."
                        : `Next reconciliation is due in ${stockReminderPreview.daysUntilDue} day${
                            stockReminderPreview.daysUntilDue === 1 ? "" : "s"
                          }.`
                      : "Stock-taking reminders are disabled."}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last completed:{" "}
                    {stockReminderPreview.lastCompletedAt
                      ? new Date(
                          stockReminderPreview.lastCompletedAt,
                        ).toLocaleString()
                      : "not recorded yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={saveStockReminderSettings}
              disabled={settings.updateSettings.isPending}
            >
              {settings.updateSettings.isPending
                ? "Saving..."
                : "Save reminder settings"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => completeStockTake.mutate()}
              disabled={completeStockTake.isPending}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {completeStockTake.isPending
                ? "Recording..."
                : "Record stock take now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
