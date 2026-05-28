export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const PLAN_IDS = ["starter", "growth", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const SUBSCRIPTION_FEATURES = [
  "pos",
  "inventory",
  "reports",
  "team",
  "offlineSync",
  "notifications",
  "advancedBranding",
  "advancedPermissions",
  "auditLogs",
] as const;
export type SubscriptionFeature = (typeof SUBSCRIPTION_FEATURES)[number];

export type PricingPlan = {
  id: PlanId;
  name: string;
  badge?: string;
  description: string;
  bestFor: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  features: string[];
  limits: string[];
};

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Core selling tools for one small shop or counter.",
    bestFor: "Solo operators",
    monthlyPriceCents: 1900,
    yearlyPriceCents: 19000,
    features: [
      "POS checkout",
      "Product and stock management",
      "Receipt settings",
      "Basic dashboard",
    ],
    limits: ["1 active register", "1 owner or admin seat"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    badge: "Most popular",
    description: "Team, reporting, and offline tools for growing shops.",
    bestFor: "Busy stores",
    monthlyPriceCents: 4900,
    yearlyPriceCents: 49000,
    features: [
      "Everything in Starter",
      "Team management",
      "Reports and exports",
      "Offline checkout queue",
      "Operational notifications",
    ],
    limits: ["Up to 5 registers", "Up to 10 team members"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Advanced controls for multi-location operators.",
    bestFor: "Scaling teams",
    monthlyPriceCents: 9900,
    yearlyPriceCents: 99000,
    features: [
      "Everything in Growth",
      "Branding and appearance controls",
      "Audit logs",
      "Advanced permission setup",
      "Priority operations support",
    ],
    limits: ["Unlimited registers", "Unlimited team members"],
  },
};

export const PRICING_PLAN_LIST = PLAN_IDS.map((id) => PRICING_PLANS[id]);

export const PLAN_RANK: Record<PlanId, number> = {
  starter: 0,
  growth: 1,
  pro: 2,
};

export const FEATURE_LABELS: Record<SubscriptionFeature, string> = {
  pos: "POS checkout",
  inventory: "inventory",
  reports: "reports",
  team: "team management",
  offlineSync: "offline sync",
  notifications: "notifications",
  advancedBranding: "appearance and branding",
  advancedPermissions: "advanced permissions",
  auditLogs: "audit logs",
};

export const FEATURE_REQUIRED_PLAN: Record<SubscriptionFeature, PlanId> = {
  pos: "starter",
  inventory: "starter",
  reports: "growth",
  team: "growth",
  offlineSync: "growth",
  notifications: "growth",
  advancedBranding: "pro",
  advancedPermissions: "pro",
  auditLogs: "pro",
};

export function parsePlanId(value: unknown): PlanId | null {
  return typeof value === "string" && PLAN_IDS.includes(value as PlanId)
    ? (value as PlanId)
    : null;
}

export function normalizePlanId(value: unknown): PlanId {
  return parsePlanId(value) ?? "starter";
}

export function parseBillingInterval(value: unknown): BillingInterval | null {
  return typeof value === "string" &&
    BILLING_INTERVALS.includes(value as BillingInterval)
    ? (value as BillingInterval)
    : null;
}

export function normalizeBillingInterval(value: unknown): BillingInterval {
  return parseBillingInterval(value) ?? "month";
}

export function comparePlans(planId: PlanId, requiredPlanId: PlanId) {
  return PLAN_RANK[planId] - PLAN_RANK[requiredPlanId];
}

export function getRequiredPlanForFeature(feature: SubscriptionFeature) {
  return FEATURE_REQUIRED_PLAN[feature];
}

export function planIncludesFeature(
  planId: PlanId,
  feature: SubscriptionFeature,
) {
  return comparePlans(planId, getRequiredPlanForFeature(feature)) >= 0;
}

export function getPlanPriceCents(planId: PlanId, interval: BillingInterval) {
  const plan = PRICING_PLANS[planId];
  return interval === "year" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
}

export function formatPlanPrice(planId: PlanId, interval: BillingInterval) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(getPlanPriceCents(planId, interval) / 100);
}

export function getMonthlyEquivalentCents(planId: PlanId) {
  return Math.round(PRICING_PLANS[planId].yearlyPriceCents / 12);
}
