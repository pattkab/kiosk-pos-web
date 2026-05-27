import { describe, expect, it } from "vitest";
import {
  getTrialDaysRemaining,
  hasSubscriptionAccess,
  isTrialExpired,
} from "@/lib/billing/access";

describe("Billing access", () => {
  it("allows active subscriptions even while webhook metadata is settling", () => {
    expect(
      hasSubscriptionAccess({
        subscription_status: "active",
        stripe_subscription_id: null,
      }),
    ).toBe(true);
  });

  it("allows unexpired trials and blocks expired trials", () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    expect(
      hasSubscriptionAccess({
        subscription_status: "trialing",
        trial_ends_at: future,
      }),
    ).toBe(true);
    expect(
      isTrialExpired({
        subscription_status: "trialing",
        trial_ends_at: future,
      }),
    ).toBe(false);
    expect(
      hasSubscriptionAccess({
        subscription_status: "trialing",
        trial_ends_at: past,
      }),
    ).toBe(false);
    expect(
      isTrialExpired({ subscription_status: "trialing", trial_ends_at: past }),
    ).toBe(true);
  });

  it("never returns negative trial days", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(getTrialDaysRemaining(past)).toBe(0);
  });
});
