"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  getTrialDaysRemaining,
  hasSubscriptionAccess,
  isTrialExpired,
} from "@/lib/billing/access";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export function BillingSettings() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const status = settings.data?.subscription_status ?? "trialing";
  const trialEndsAt = settings.data?.trial_ends_at ?? null;
  const hasAccess = hasSubscriptionAccess(settings.data);
  const trialExpired = isTrialExpired(settings.data);
  const trialDaysLeft = useMemo(
    () => getTrialDaysRemaining(trialEndsAt),
    [trialEndsAt],
  );
  const subscriptionRequired = searchParams.get("required") === "1";
  const hasBillingCustomer = Boolean(settings.data?.stripe_customer_id);
  const statusLabel =
    status === "active"
      ? "Active"
      : trialExpired
        ? "Trial ended"
        : status === "trialing"
          ? "Trial"
          : status.replaceAll("_", " ");

  const startCheckout = async () => {
    if (!activeOrganization?.id) return;
    setIsCheckoutLoading(true);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: activeOrganization.id }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.error ?? "Failed to start checkout.");
      }
      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start checkout.",
      );
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
      const result = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.error ?? "Failed to open billing portal.");
      }
      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to open billing portal.",
      );
    } finally {
      setIsPortalLoading(false);
    }
  };

  const checkoutStatus = searchParams.get("status");
  useEffect(() => {
    if (checkoutStatus === "success") {
      toast.success("Subscription updated. Thank you!");
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
    }
    if (checkoutStatus === "cancelled") {
      toast.info("Checkout cancelled. Your plan was not changed.");
    }
  }, [checkoutStatus, queryClient]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Billing & subscription</CardTitle>
            <CardDescription>
              One simple annual plan after the free trial.
            </CardDescription>
          </div>
          <Badge
            variant={hasAccess ? "default" : "destructive"}
            className="w-fit capitalize"
          >
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionRequired && !hasAccess ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            Your free trial has ended. Subscribe to the annual plan to continue
            using Kiosk POS.
          </div>
        ) : null}

        <div className="rounded-lg border bg-muted/20 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-muted-foreground">
                Kiosk POS Pro
              </p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-4xl font-black tracking-tight">$20</p>
                <p className="pb-1 text-sm font-semibold text-muted-foreground">
                  per year
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Includes checkout, inventory, reports, offline sync, and team
                management.
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>30-day trial before payment is required</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Secure card billing through Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Promotion codes supported at checkout</span>
              </div>
            </div>
          </div>
        </div>

        {trialEndsAt && !settings.data?.stripe_subscription_id ? (
          <div className="rounded-md border p-3 text-sm">
            {trialExpired ? (
              <p className="font-medium text-destructive">
                Free trial ended on {new Date(trialEndsAt).toLocaleDateString()}
                .
              </p>
            ) : (
              <p>
                <span className="font-medium">
                  {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}
                </span>{" "}
                left in your free trial (ends{" "}
                {new Date(trialEndsAt).toLocaleDateString()}).
              </p>
            )}
          </div>
        ) : null}

        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          Billing applies per organization. Owners and admins can manage payment
          details from this page.
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="h-11 font-bold"
            onClick={startCheckout}
            disabled={isCheckoutLoading}
          >
            {isCheckoutLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening checkout...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {trialExpired ? "Subscribe to continue" : "Subscribe now"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="h-11 font-bold"
            onClick={openPortal}
            disabled={isPortalLoading || !hasBillingCustomer}
          >
            {isPortalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening portal...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage billing
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
