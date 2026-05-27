"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganizationSettings } from "@/hooks/use-organization";
import { organizationSettingsSchema, OrganizationSettingsValues } from "@/validators/organization";

export function OrganizationOperationalSettings({ mode }: { mode: "receipt" | "tax" }) {
  const settings = useOrganizationSettings();
  const form = useForm<OrganizationSettingsValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      tax_rate: 0,
      receipt_header: "",
      receipt_footer: "",
      low_stock_threshold_default: 5,
    },
  });

  useEffect(() => {
    if (settings.data) {
      form.reset({
        tax_rate: Number(settings.data.tax_rate ?? 0),
        receipt_header: settings.data.receipt_header ?? "",
        receipt_footer: settings.data.receipt_footer ?? "",
        low_stock_threshold_default: Number(settings.data.low_stock_threshold_default ?? 5),
      });
    }
  }, [form, settings.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "receipt" ? "Receipt settings" : "Tax settings"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => settings.updateSettings.mutate(values))}>
          {mode === "receipt" ? (
            <>
              <div className="space-y-2">
                <Label>Receipt header</Label>
                <Input {...form.register("receipt_header")} />
              </div>
              <div className="space-y-2">
                <Label>Receipt footer message</Label>
                <Input {...form.register("receipt_footer")} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Tax rate (%)</Label>
                <Input type="number" step="0.01" {...form.register("tax_rate")} />
              </div>
              <div className="space-y-2">
                <Label>Default low stock threshold</Label>
                <Input type="number" {...form.register("low_stock_threshold_default")} />
              </div>
            </>
          )}
          <Button disabled={settings.updateSettings.isPending}>Save settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
