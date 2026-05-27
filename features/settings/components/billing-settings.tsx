"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveOrganization, useOrganizationSettings } from "@/hooks/use-organization";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  getTrialDaysRemaining,
  hasSubscriptionAccess,
  isTrialExpired,
} from "@/lib/billing/access";

export function BillingSettings() {
  const searchParams = useSearchParams();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const status = settings.data?.subscription_status ?? "trialing";
  const trialEndsAt = settings.data?.trial_ends_at ?? null;
  const hasAccess = hasSubscriptionAccess(settings.data);
  const trialExpired = isTrialExpired(settings.data);
  const trialDaysLeft = useMemo(() => getTrialDaysRemaining(trialEndsAt), [trialEndsAt]);
  const subscriptionRequired = searchParams.get("required") === "1";

  const startCheckout = async () => {
    if (!activeOrganization?.id) return;
    setIsCheckoutLoading(true);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: activeOrganization.id }),
      });
      const result = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.error ?? "Failed to start checkout.");
      }
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const openPortal = async () => {
    if (!activeOrganization?.id) return;
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/billing/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: activeOrganization.id }),
      });
      const result = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.error ?? "Failed to open billing portal.");
      }
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open billing portal.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const checkoutStatus = searchParams.get("status");
  useEffect(() => {
    if (checkoutStatus === "success") {
      toast.success("Subscription updated. Thank you!");
    }
  }, [checkoutStatus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionRequired && !hasAccess ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            Your free trial has ended. Subscribe to the annual plan to continue using Kiosk POS.
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Plan</p>
            <p className="text-xl font-bold">$20/year</p>
            <p className="text-sm text-muted-foreground">
              1-month free trial, then annual subscription required.
            </p>
          </div>
          <Badge variant={hasAccess ? "default" : "destructive"}>{status}</Badge>
        </div>

        {trialEndsAt && !settings.data?.stripe_subscription_id ? (
          <div className="rounded-md border p-3 text-sm">
            {trialExpired ? (
              <p className="font-medium text-destructive">Free trial ended on {new Date(trialEndsAt).toLocaleDateString()}.</p>
            ) : (
              <p>
                <span className="font-medium">{trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}</span>{" "}
                left in your free trial (ends {new Date(trialEndsAt).toLocaleDateString()}).
              </p>
            )}
          </div>
        ) : null}

        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          Accepts debit/credit cards including Visa and Mastercard through secure Stripe Checkout.
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={startCheckout} disabled={isCheckoutLoading}>
            {isCheckoutLoading ? "Opening checkout..." : trialExpired ? "Subscribe to continue" : "Subscribe now"}
          </Button>
          <Button
            variant="outline"
            onClick={openPortal}
            disabled={isPortalLoading || !settings.data?.stripe_customer_id}
          >
            {isPortalLoading ? "Opening portal..." : "Manage billing"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
