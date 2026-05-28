import {
  canUseFeature,
  comparePlans,
  enforceSubscriptionAccess,
  getPlanFromSubscription,
  normalizeSubscriptionStatus,
  type PlanId,
  type SubscriptionFeature,
} from "@/lib/billing/plans";

export type SubscriptionSettings = {
  plan?: string | null;
  subscription_status?: string | null;
  subscription_plan?: string | null;
  stripe_subscription_id?: string | null;
  trial_ends_at?: string | null;
  current_period_ends_at?: string | null;
  billing_cycle?: string | null;
};

export function hasSubscriptionAccess(
  settings: SubscriptionSettings | null | undefined,
) {
  return enforceSubscriptionAccess(settings).ok;
}

export function getCurrentPlan(
  settings: SubscriptionSettings | null | undefined,
) {
  return getPlanFromSubscription(settings);
}

export function isTrialAccess(
  settings: SubscriptionSettings | null | undefined,
) {
  if (
    !settings ||
    normalizeSubscriptionStatus(settings.subscription_status) !== "trialing"
  )
    return false;
  if (!settings.trial_ends_at) return true;
  return new Date(settings.trial_ends_at).getTime() > Date.now();
}

export function hasPlanAccess(
  settings: SubscriptionSettings | null | undefined,
  requiredPlan: PlanId,
) {
  if (!hasSubscriptionAccess(settings)) return false;
  return comparePlans(getCurrentPlan(settings), requiredPlan) >= 0;
}

export function hasFeatureAccess(
  settings: SubscriptionSettings | null | undefined,
  feature: SubscriptionFeature,
) {
  return canUseFeature(settings, feature);
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
  const status = normalizeSubscriptionStatus(settings.subscription_status);
  if (status === "active" || status === "free") {
    return false;
  }
  if (status !== "trialing") return false;
  if (!settings.trial_ends_at) return false;
  return new Date(settings.trial_ends_at).getTime() <= Date.now();
}
