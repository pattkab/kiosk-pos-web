import {
  comparePlans,
  getRequiredPlanForFeature,
  normalizePlanId,
  type PlanId,
  type SubscriptionFeature,
} from "@/lib/billing/plans";

export type SubscriptionSettings = {
  subscription_status?: string | null;
  subscription_plan?: string | null;
  stripe_subscription_id?: string | null;
  trial_ends_at?: string | null;
};

export function hasSubscriptionAccess(
  settings: SubscriptionSettings | null | undefined,
) {
  if (!settings) return false;

  if (settings.subscription_status === "active") {
    return true;
  }

  if (settings.trial_ends_at) {
    return new Date(settings.trial_ends_at).getTime() > Date.now();
  }

  return settings.subscription_status === "trialing";
}

export function getCurrentPlan(
  settings: SubscriptionSettings | null | undefined,
) {
  return normalizePlanId(settings?.subscription_plan);
}

export function isTrialAccess(
  settings: SubscriptionSettings | null | undefined,
) {
  if (!settings || settings.subscription_status !== "trialing") return false;
  if (!settings.trial_ends_at) return true;
  return new Date(settings.trial_ends_at).getTime() > Date.now();
}

export function hasPlanAccess(
  settings: SubscriptionSettings | null | undefined,
  requiredPlan: PlanId,
) {
  if (!hasSubscriptionAccess(settings)) return false;
  if (isTrialAccess(settings)) return true;
  return comparePlans(getCurrentPlan(settings), requiredPlan) >= 0;
}

export function hasFeatureAccess(
  settings: SubscriptionSettings | null | undefined,
  feature: SubscriptionFeature,
) {
  return hasPlanAccess(settings, getRequiredPlanForFeature(feature));
}

export function getTrialDaysRemaining(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isTrialExpired(
  settings: SubscriptionSettings | null | undefined,
) {
  if (!settings) return true;
  if (settings.subscription_status === "active") {
    return false;
  }
  if (!settings.trial_ends_at) return false;
  return new Date(settings.trial_ends_at).getTime() <= Date.now();
}
