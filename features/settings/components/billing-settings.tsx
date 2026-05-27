"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveOrganization, useOrganizationSettings } from "@/hooks/use-organization";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function BillingSettings() {
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const status = settings.data?.subscription_status ?? "trialing";
  const isActive = status === "active" || status === "trialing";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Plan</p>
            <p className="text-xl font-bold">$20/year</p>
            <p className="text-sm text-muted-foreground">Billed annually. Cancel any time.</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>{status}</Badge>
        </div>

        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          Accepts debit/credit cards including Visa and Mastercard through secure Stripe Checkout.
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={startCheckout} disabled={isCheckoutLoading}>
            {isCheckoutLoading ? "Opening checkout..." : "Subscribe now"}
          </Button>
          <Button variant="outline" onClick={openPortal} disabled={isPortalLoading}>
            {isPortalLoading ? "Opening portal..." : "Manage billing"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
