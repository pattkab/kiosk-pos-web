export type SubscriptionSettings = {
  subscription_status?: string | null;
  subscription_plan?: string | null;
  stripe_subscription_id?: string | null;
  trial_ends_at?: string | null;
};

export function hasSubscriptionAccess(settings: SubscriptionSettings | null | undefined) {
  if (!settings) return false;

  if (settings.subscription_status === "active" && settings.stripe_subscription_id) {
    return true;
  }

  if (settings.trial_ends_at) {
    return new Date(settings.trial_ends_at).getTime() > Date.now();
  }

  return settings.subscription_status === "trialing";
}

export function getTrialDaysRemaining(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isTrialExpired(settings: SubscriptionSettings | null | undefined) {
  if (!settings) return true;
  if (settings.subscription_status === "active" && settings.stripe_subscription_id) {
    return false;
  }
  if (!settings.trial_ends_at) return false;
  return new Date(settings.trial_ends_at).getTime() <= Date.now();
}
