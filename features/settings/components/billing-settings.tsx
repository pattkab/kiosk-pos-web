"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import {
  getCurrentPlan,
  getTrialDaysRemaining,
  hasSubscriptionAccess,
  isTrialExpired,
} from "@/lib/billing/access";
import {
  FEATURE_LABELS,
  PRICING_PLAN_LIST,
  comparePlans,
  formatPlanPrice,
  getMonthlyEquivalentCents,
  normalizeBillingInterval,
  parsePlanId,
  type BillingInterval,
  type PlanId,
  type SubscriptionFeature,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getFeatureLabel(value: string | null) {
  if (!value || !(value in FEATURE_LABELS)) return null;
  return FEATURE_LABELS[value as SubscriptionFeature];
}

export function BillingSettings() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(() =>
    normalizeBillingInterval(searchParams.get("interval")),
  );
  const [checkoutPlanId, setCheckoutPlanId] = useState<PlanId | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const status = settings.data?.subscription_status ?? "trialing";
  const currentPlan = getCurrentPlan(settings.data);
  const trialEndsAt = settings.data?.trial_ends_at ?? null;
  const hasAccess = hasSubscriptionAccess(settings.data);
  const trialExpired = isTrialExpired(settings.data);
  const trialDaysLeft = useMemo(
    () => getTrialDaysRemaining(trialEndsAt),
    [trialEndsAt],
  );
  const subscriptionRequired = searchParams.get("required") === "1";
  const requiredPlan = parsePlanId(searchParams.get("requiredPlan"));
  const requiredFeatureLabel = getFeatureLabel(searchParams.get("feature"));
  const hasBillingCustomer = Boolean(settings.data?.stripe_customer_id);
  const isActiveSubscription = status === "active";
  const statusLabel =
    status === "active"
      ? "Active"
      : trialExpired
        ? "Trial ended"
        : status === "trialing"
          ? "Trial"
          : status.replaceAll("_", " ");

  const startCheckout = async (planId: PlanId) => {
    if (!activeOrganization?.id) return;
    setCheckoutPlanId(planId);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrganization.id,
          planId,
          interval: billingInterval,
        }),
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
      setCheckoutPlanId(null);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Billing & subscription
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Choose the tier that matches how your store operates. Trials unlock
            all tiers, then the active subscription controls paid features.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={hasAccess ? "default" : "destructive"}
            className="w-fit capitalize"
          >
            {statusLabel}
          </Badge>
          {isActiveSubscription ? (
            <Badge variant="outline" className="w-fit capitalize">
              {currentPlan}
            </Badge>
          ) : null}
        </div>
      </div>

      {subscriptionRequired && !hasAccess ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          Your free trial has ended. Choose a paid tier to continue using Kiosk
          POS.
        </div>
      ) : null}

      {requiredPlan ? (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
          {requiredFeatureLabel ? (
            <>
              {requiredFeatureLabel} requires the{" "}
              <span className="font-bold capitalize">{requiredPlan}</span> tier
              or higher.
            </>
          ) : (
            <>
              This feature requires the{" "}
              <span className="font-bold capitalize">{requiredPlan}</span> tier
              or higher.
            </>
          )}
        </div>
      ) : null}

      {trialEndsAt && !settings.data?.stripe_subscription_id ? (
        <div className="rounded-md border p-3 text-sm">
          {trialExpired ? (
            <p className="font-medium text-destructive">
              Free trial ended on {new Date(trialEndsAt).toLocaleDateString()}.
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

      <div className="flex w-fit rounded-md border bg-background p-1">
        {(["month", "year"] as const).map((interval) => (
          <Button
            key={interval}
            type="button"
            variant={billingInterval === interval ? "default" : "ghost"}
            size="sm"
            className="capitalize"
            onClick={() => setBillingInterval(interval)}
          >
            {interval === "month" ? "Monthly" : "Yearly"}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {PRICING_PLAN_LIST.map((plan) => {
          const isCurrent =
            isActiveSubscription && hasAccess && plan.id === currentPlan;
          const isHighlighted =
            plan.id === requiredPlan || (!requiredPlan && plan.id === "growth");
          const isDowngrade =
            isActiveSubscription &&
            comparePlans(plan.id, currentPlan) < 0 &&
            !isCurrent;
          const isLoading = checkoutPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden",
                isHighlighted && "border-primary shadow-md",
              )}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.bestFor}</CardDescription>
                  </div>
                  {plan.badge || isCurrent ? (
                    <Badge variant={isCurrent ? "default" : "secondary"}>
                      {isCurrent ? "Current" : plan.badge}
                    </Badge>
                  ) : null}
                </div>
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tight">
                      {formatPlanPrice(plan.id, billingInterval)}
                    </span>
                    <span className="pb-1 text-sm font-semibold text-muted-foreground">
                      /{billingInterval}
                    </span>
                  </div>
                  {billingInterval === "year" ? (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      {formatUsd(getMonthlyEquivalentCents(plan.id))}/month
                      equivalent
                    </p>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2 text-sm">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 rounded-md border bg-muted/25 p-3 text-xs text-muted-foreground">
                  {plan.limits.map((limit) => (
                    <div key={limit} className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>{limit}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="h-11 w-full font-bold"
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent || Boolean(checkoutPlanId)}
                  onClick={() => startCheckout(plan.id)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening checkout...
                    </>
                  ) : isCurrent ? (
                    "Current plan"
                  ) : (
                    <>
                      {isDowngrade ? (
                        <CreditCard className="mr-2 h-4 w-4" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {isActiveSubscription
                        ? isDowngrade
                          ? "Switch plan"
                          : "Upgrade"
                        : "Start plan"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-md border p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Billing applies per organization. Owners and admins can manage payment
          methods, invoices, and cancellation in Stripe.
        </p>
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
    </div>
  );
}
