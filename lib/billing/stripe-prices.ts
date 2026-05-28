import {
  BILLING_INTERVALS,
  PLAN_IDS,
  type BillingInterval,
  type PlanId,
} from "@/lib/billing/plans";

const STRIPE_PRICE_ENV: Record<PlanId, Record<BillingInterval, string>> = {
  starter: {
    month: "STRIPE_PRICE_STARTER_MONTHLY",
    year: "STRIPE_PRICE_STARTER_YEARLY",
  },
  growth: {
    month: "STRIPE_PRICE_GROWTH_MONTHLY",
    year: "STRIPE_PRICE_GROWTH_YEARLY",
  },
  pro: {
    month: "STRIPE_PRICE_PRO_MONTHLY",
    year: "STRIPE_PRICE_PRO_YEARLY",
  },
};

export function getStripePriceEnvName(
  planId: PlanId,
  interval: BillingInterval,
) {
  return STRIPE_PRICE_ENV[planId][interval];
}

export function getStripePriceId(planId: PlanId, interval: BillingInterval) {
  return process.env[getStripePriceEnvName(planId, interval)] || null;
}

export function inferPlanIdFromStripePriceId(priceId: string | null) {
  if (!priceId) return null;

  for (const planId of PLAN_IDS) {
    for (const interval of BILLING_INTERVALS) {
      if (process.env[getStripePriceEnvName(planId, interval)] === priceId) {
        return planId;
      }
    }
  }

  return null;
}
