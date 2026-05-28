"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  getEffectivePlan,
  getTrialDaysRemaining,
  isTrialAccess,
  isTrialExpired,
} from "@/lib/billing/access";
import { TRIAL_EFFECTIVE_PLAN } from "@/lib/billing/plans";
import {
  FEATURE_LABELS,
  PLAN_LIMIT_KEYS,
  PRICING_PLAN_LIST,
  PRICING_PLANS,
  billingIntervalToCycle,
  comparePlans,
  getAnnualSavingsCents,
  getAnnualSavingsPercent,
  getPlanLimits,
  getPlanPriceCents,
  getUpgradeRecommendation,
  normalizeBillingInterval,
  normalizeSubscriptionStatus,
  parsePlanId,
  type BillingInterval,
  type PlanId,
  type PlanLimitKey,
  type SubscriptionFeature,
} from "@/lib/billing/plans";
import {
  formatLocalPriceFromUsdCents,
  formatUsdCents,
} from "@/lib/billing/currency";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  CheckCircle2,
  Infinity,
  Loader2,
  Lock,
  Sparkles,
  WalletCards,
} from "lucide-react";

type BillingUsage = Record<PlanLimitKey, number>;

const COMPARISON_ROWS: Array<{
  label: string;
  starter: string;
  growth: string;
  business: string;
  enterprise: string;
}> = [
  {
    label: "Outlets",
    starter: "1",
    growth: "2",
    business: "10",
    enterprise: "Unlimited",
  },
  {
    label: "Registers",
    starter: "1",
    growth: "5",
    business: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    label: "Users",
    starter: "2",
    growth: "8",
    business: "50",
    enterprise: "Unlimited",
  },
  {
    label: "Products/SKUs",
    starter: "300",
    growth: "10,000",
    business: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    label: "Barcode scanning",
    starter: "-",
    growth: "Included",
    business: "Included",
    enterprise: "Included",
  },
  {
    label: "Customer accounts",
    starter: "-",
    growth: "Included",
    business: "Included",
    enterprise: "Included",
  },
  {
    label: "Pharmacy expiry tracking",
    starter: "-",
    growth: "-",
    business: "Included",
    enterprise: "Included",
  },
  {
    label: "Audit logs",
    starter: "-",
    growth: "-",
    business: "Included",
    enterprise: "Included",
  },
  {
    label: "API and custom integrations",
    starter: "-",
    growth: "-",
    business: "-",
    enterprise: "Included",
  },
];

const FAQS = [
  {
    question: "Is Starter really free?",
    answer:
      "Yes. Core checkout, sales tracking, basic inventory, receipts, and basic reports stay free for one outlet.",
  },
  {
    question: "What does Kiosk POS charge for?",
    answer:
      "Growth features around more users, registers, customer accounts, barcode workflows, reporting, and operational complexity.",
  },
  {
    question: "Is Stripe connected?",
    answer:
      "Not yet. Upgrade and downgrade actions are mocked so the product flow is ready before a payment provider is connected.",
  },
];

function getFeatureLabel(value: string | null) {
  if (!value || !(value in FEATURE_LABELS)) return null;
  return FEATURE_LABELS[value as SubscriptionFeature];
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatLimit(value: number | null) {
  return value === null ? "Unlimited" : formatCount(value);
}

function useBillingUsage(organizationId?: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["billing-usage", organizationId],
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<BillingUsage> => {
      const [products, registers, members] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId!),
        supabase
          .from("cash_registers")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId!)
          .eq("is_active", true),
        supabase
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId!)
          .is("removed_at", null),
      ]);

      if (products.error) throw products.error;
      if (registers.error) throw registers.error;
      if (members.error) throw members.error;

      return {
        outlets: 1,
        registers: registers.count ?? 0,
        users: members.count ?? 0,
        products: products.count ?? 0,
      };
    },
  });
}

function PlanPrice({
  planId,
  interval,
  localCurrency,
}: {
  planId: PlanId;
  interval: BillingInterval;
  localCurrency: string | null | undefined;
}) {
  const priceCents = getPlanPriceCents(planId, interval);
  const localPrice = formatLocalPriceFromUsdCents(priceCents, localCurrency);

  if (priceCents === null) {
    return (
      <div>
        <div className="text-3xl font-black tracking-tight">Contact Sales</div>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Custom pricing
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <span className="text-4xl font-black tracking-tight">
          {formatUsdCents(priceCents)}
        </span>
        <span className="pb-1 text-sm font-semibold text-muted-foreground">
          /{interval === "year" ? "year" : "month"}
        </span>
      </div>
      {localPrice && localPrice.currency !== "USD" ? (
        <p className="mt-2 text-lg font-bold leading-tight text-emerald-700 sm:text-xl">
          ≈ {localPrice.label}
          <span className="text-sm font-semibold text-emerald-700/80">
            {" "}
            /{interval === "year" ? "year" : "month"}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-emerald-700">
          USD billing
        </p>
      )}
    </div>
  );
}

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const remaining = limit === null ? null : Math.max(0, limit - used);

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatCount(used)}/{formatLimit(limit)}
        </span>
      </div>
      {limit === null ? (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
          <Infinity className="h-3.5 w-3.5" />
          Unlimited on this plan
        </div>
      ) : (
        <>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div
              className={cn(
                "h-2 rounded-full",
                percent >= 90 ? "bg-amber-500" : "bg-primary",
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatCount(remaining ?? 0)} remaining
          </p>
        </>
      )}
    </div>
  );
}

export function BillingSettings() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const usage = useBillingUsage(activeOrganization?.id);
  const requestedInterval = searchParams.get("interval");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(() =>
    normalizeBillingInterval(requestedInterval ?? settings.data?.billing_cycle),
  );
  const [savingPlanId, setSavingPlanId] = useState<PlanId | null>(null);

  const status = normalizeSubscriptionStatus(
    settings.data?.subscription_status,
  );
  const currentPlan = getCurrentPlan(settings.data);
  const effectivePlan = getEffectivePlan(settings.data);
  const onActiveTrial = isTrialAccess(settings.data);
  const trialExpired = isTrialExpired(settings.data);
  const trialDaysRemaining = getTrialDaysRemaining(settings.data?.trial_ends_at);
  const currentPlanConfig = PRICING_PLANS[currentPlan];
  const effectivePlanConfig = PRICING_PLANS[effectivePlan];
  const localCurrency = activeOrganization?.currency ?? "USD";
  const requiredPlan = parsePlanId(searchParams.get("requiredPlan"));
  const requiredFeatureLabel = getFeatureLabel(searchParams.get("feature"));
  const requiredFeature = searchParams.get(
    "feature",
  ) as SubscriptionFeature | null;
  const recommendation =
    requiredFeature && requiredFeature in FEATURE_LABELS
      ? getUpgradeRecommendation(requiredFeature)
      : null;
  const annualSavings = useMemo(
    () =>
      PRICING_PLAN_LIST.filter((plan) => plan.id !== "enterprise").map(
        (plan) => ({
          planId: plan.id,
          savings: getAnnualSavingsCents(plan.id) ?? 0,
          percent: getAnnualSavingsPercent(plan.id),
        }),
      ),
    [],
  );

  useEffect(() => {
    if (requestedInterval) return;
    if (!settings.data?.billing_cycle) return;
    setBillingInterval(normalizeBillingInterval(settings.data.billing_cycle));
  }, [requestedInterval, settings.data?.billing_cycle]);

  const updatePlan = async (planId: PlanId) => {
    if (!activeOrganization?.id) return;
    if (planId === "enterprise") {
      toast.info("Enterprise is handled through Contact Sales for now.");
      return;
    }

    setSavingPlanId(planId);
    try {
      const now = new Date();
      const periodEndsAt =
        planId === "starter"
          ? null
          : new Date(
              now.getTime() +
                (billingInterval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000,
            ).toISOString();

      const { error } = await supabase.from("organization_settings").upsert(
        {
          organization_id: activeOrganization.id,
          plan: planId,
          subscription_plan: planId,
          subscription_status: planId === "starter" ? "free" : "active",
          billing_cycle: billingIntervalToCycle(billingInterval),
          trial_ends_at: null,
          current_period_ends_at: periodEndsAt,
        },
        { onConflict: "organization_id" },
      );
      if (error) throw error;

      await supabase.rpc("write_audit_log", {
        p_organization_id: activeOrganization.id,
        p_action: "UPDATE_SUBSCRIPTION_PLAN",
        p_entity_type: "organization_settings",
        p_entity_id: activeOrganization.id,
        p_metadata: {
          plan: planId,
          billing_cycle: billingIntervalToCycle(billingInterval),
          mocked: true,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      queryClient.invalidateQueries({ queryKey: ["billing-usage"] });
      toast.success(
        planId === "starter"
          ? "Switched to Starter"
          : `Mock subscription updated to ${PRICING_PLANS[planId].name}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We could not update the plan right now.",
      );
    } finally {
      setSavingPlanId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Billing & subscription
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Affordable POS pricing for SMBs, with free core checkout and paid
            upgrades for operational complexity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === "past_due" ? "destructive" : "default"}>
            {status.replaceAll("_", " ")}
          </Badge>
          <Badge variant="outline">{currentPlanConfig.name}</Badge>
          <Badge variant="secondary">{localCurrency}</Badge>
        </div>
      </div>

      {onActiveTrial ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold text-emerald-950 dark:text-emerald-50">
                Full-access trial — {trialDaysRemaining} day
                {trialDaysRemaining === 1 ? "" : "s"} left
              </p>
              <p className="mt-1 text-muted-foreground">
                You have {PRICING_PLANS[TRIAL_EFFECTIVE_PLAN].name} features and
                limits until your trial ends. After that, paid features require
                Growth or Business unless you stay on free Starter.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {trialExpired ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-bold">Your trial has ended</p>
          <p className="mt-1 text-muted-foreground">
            You are on free Starter. Upgrade to keep barcode scanning, reports,
            team tools, and other paid features you used during the trial.
          </p>
        </div>
      ) : null}

      {requiredPlan || recommendation ? (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-4 text-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">
                {requiredFeatureLabel
                  ? `${requiredFeatureLabel} is locked on your current plan.`
                  : "This feature is locked on your current plan."}
              </p>
              <p className="mt-1 text-muted-foreground">
                {recommendation?.message ??
                  `Upgrade to ${requiredPlan ? PRICING_PLANS[requiredPlan].name : "a higher plan"} to continue.`}
              </p>
            </div>
            <Button
              className="w-full font-bold sm:w-auto"
              onClick={() =>
                updatePlan(recommendation?.plan ?? requiredPlan ?? "growth")
              }
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {recommendation?.cta ?? "Upgrade"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-md border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Current plan
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {onActiveTrial
                  ? `${currentPlanConfig.name} trial`
                  : currentPlanConfig.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {onActiveTrial
                  ? `${effectivePlanConfig.name} features unlocked until your trial ends.`
                  : currentPlanConfig.description}
              </p>
            </div>
            <WalletCards className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Billing cycle</span>
              <span className="font-semibold capitalize">
                {billingInterval === "year" ? "Yearly" : "Monthly"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Upgrade path</span>
              <span className="font-semibold">
                {currentPlan === "starter"
                  ? "Growth"
                  : currentPlan === "growth"
                    ? "Business"
                    : currentPlan === "business"
                      ? "Enterprise"
                      : "Custom"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Yearly savings</span>
              <span className="font-semibold">
                {currentPlan === "enterprise"
                  ? "Custom"
                  : formatUsdCents(getAnnualSavingsCents(currentPlan) ?? 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Plan usage
              </p>
              <h3 className="mt-1 text-xl font-black">Limits remaining</h3>
            </div>
            {usage.isLoading ? (
              <Badge variant="outline">Loading usage</Badge>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLAN_LIMIT_KEYS.map((key) => (
              <UsageRow
                key={key}
                label={key[0].toUpperCase() + key.slice(1)}
                used={usage.data?.[key] ?? 0}
                limit={getPlanLimits(settings.data ?? currentPlan)[key]}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="text-sm font-medium text-emerald-700">
          Yearly saves Growth {formatUsdCents(annualSavings[1]?.savings ?? 0)}{" "}
          and Business {formatUsdCents(annualSavings[2]?.savings ?? 0)}.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {PRICING_PLAN_LIST.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isHighlighted =
            plan.recommended ||
            plan.id === requiredPlan ||
            plan.id === recommendation?.plan;
          const isDowngrade = comparePlans(plan.id, currentPlan) < 0;
          const isLoading = savingPlanId === plan.id;
          const savingsPercent = getAnnualSavingsPercent(plan.id);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col overflow-hidden",
                isHighlighted && "border-primary shadow-md",
              )}
            >
              {plan.recommended ? (
                <div className="absolute right-3 top-3">
                  <Badge>{plan.badge}</Badge>
                </div>
              ) : null}
              <CardHeader className="space-y-3 pr-24">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.label}</CardDescription>
                </div>
                <PlanPrice
                  planId={plan.id}
                  interval={billingInterval}
                  localCurrency={localCurrency}
                />
                {billingInterval === "year" && savingsPercent > 0 ? (
                  <Badge variant="secondary" className="w-fit">
                    Save {savingsPercent}% annually
                  </Badge>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <div className="grid gap-2 text-sm">
                  {plan.limitLabels.map((limit) => (
                    <div key={limit} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{limit}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 text-sm">
                  {plan.features
                    .slice(0, plan.id === "starter" ? 8 : 9)
                    .map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                </div>
                {plan.restrictions?.length ? (
                  <div className="grid gap-2 rounded-md border bg-muted/25 p-3 text-xs text-muted-foreground">
                    {plan.restrictions.slice(0, 4).map((restriction) => (
                      <div key={restriction} className="flex items-start gap-2">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{restriction}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button
                  className="mt-auto h-11 w-full font-bold"
                  variant={
                    isCurrent
                      ? "secondary"
                      : plan.recommended
                        ? "default"
                        : "outline"
                  }
                  disabled={isCurrent || Boolean(savingPlanId)}
                  onClick={() => updatePlan(plan.id)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : isCurrent ? (
                    "Current plan"
                  ) : plan.id === "enterprise" ? (
                    "Contact Sales"
                  ) : isDowngrade ? (
                    "Downgrade"
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="border-b p-4">
          <h3 className="text-xl font-black">Plan comparison</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Core checkout is free. Paid tiers unlock more operating capacity and
            control.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-bold">Feature</th>
                {PRICING_PLAN_LIST.map((plan) => (
                  <th key={plan.id} className="p-3 font-bold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="p-3 font-medium">{row.label}</td>
                  <td className="p-3 text-muted-foreground">{row.starter}</td>
                  <td className="p-3 text-muted-foreground">{row.growth}</td>
                  <td className="p-3 text-muted-foreground">{row.business}</td>
                  <td className="p-3 text-muted-foreground">
                    {row.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {FAQS.map((item) => (
          <div key={item.question} className="rounded-md border bg-card p-4">
            <h3 className="font-bold">{item.question}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
