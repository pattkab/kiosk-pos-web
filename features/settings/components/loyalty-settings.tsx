"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganizationSettings } from "@/hooks/use-organization";
import {
  loyaltySettingsSchema,
  type LoyaltySettingsValues,
} from "@/validators/loyalty";
import { parseLoyaltySettings } from "@/lib/loyalty/calculations";
import { canUseFeature } from "@/lib/billing/plans";
import Link from "next/link";
import { Gift } from "lucide-react";

export function LoyaltySettings() {
  const settings = useOrganizationSettings();
  const canUseLoyalty = canUseFeature(settings.data, "customerAccounts");

  const form = useForm<LoyaltySettingsValues>({
    resolver: zodResolver(loyaltySettingsSchema),
    defaultValues: parseLoyaltySettings(null),
  });

  useEffect(() => {
    if (settings.data) {
      form.reset(parseLoyaltySettings(settings.data));
    }
  }, [form, settings.data]);

  if (!canUseLoyalty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Loyalty program
          </CardTitle>
          <CardDescription>
            Customer accounts and loyalty are available on the Growth plan and above.
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
      <div>
        <h2 className="text-xl font-bold tracking-tight">Loyalty program</h2>
        <p className="text-sm text-muted-foreground">
          Reward repeat customers with points at checkout. Manage customers from{" "}
          <Link href="/customers" className="font-medium text-primary underline-offset-4 hover:underline">
            Customers
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earn &amp; redeem rules</CardTitle>
          <CardDescription>
            Points are earned on the amount due after loyalty redemption. Cashiers attach a customer in POS before payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) =>
              settings.updateSettings.mutate(values),
            )}
          >
            <label className="flex items-center gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                {...form.register("loyalty_enabled")}
              />
              <div>
                <p className="font-medium">Enable loyalty program</p>
                <p className="text-sm text-muted-foreground">
                  Show points balance at POS and award points on completed sales.
                </p>
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Earn points</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    {...form.register("loyalty_earn_points_per_unit")}
                  />
                  <span className="text-sm text-muted-foreground">point(s) per</span>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    {...form.register("loyalty_earn_spend_unit")}
                  />
                  <span className="text-sm text-muted-foreground">spent</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Redeem points</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    {...form.register("loyalty_redeem_points_unit")}
                  />
                  <span className="text-sm text-muted-foreground">pts =</span>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    {...form.register("loyalty_redeem_value_unit")}
                  />
                  <span className="text-sm text-muted-foreground">discount</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loyalty_min_redeem_points">Minimum redeem</Label>
                <Input
                  id="loyalty_min_redeem_points"
                  type="number"
                  min={1}
                  {...form.register("loyalty_min_redeem_points")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loyalty_max_redeem_percent">Max redeem per order (%)</Label>
                <Input
                  id="loyalty_max_redeem_percent"
                  type="number"
                  min={1}
                  max={100}
                  {...form.register("loyalty_max_redeem_percent")}
                />
              </div>
            </div>

            <Button type="submit" disabled={settings.updateSettings.isPending}>
              Save loyalty settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
