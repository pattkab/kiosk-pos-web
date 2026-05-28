import { describe, expect, it } from "vitest";
import {
  getCurrentPlan,
  getTrialDaysRemaining,
  hasFeatureAccess,
  hasPlanAccess,
  hasSubscriptionAccess,
  isTrialExpired,
} from "@/lib/billing/access";
import {
  canUseFeature,
  formatPlanPrice,
  getAnnualSavingsCents,
  getPlanLimits,
  getUpgradeRecommendation,
  hasReachedLimit,
  normalizeBillingCycle,
  normalizePlanId,
} from "@/lib/billing/plans";

describe("Billing access", () => {
  it("allows free Starter access without a trial or Stripe subscription", () => {
    expect(
      hasSubscriptionAccess({
        subscription_status: "free",
        plan: "starter",
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

  it("gates operational complexity by plan", () => {
    expect(
      hasPlanAccess({ subscription_status: "free", plan: "starter" }, "growth"),
    ).toBe(false);
    expect(
      hasFeatureAccess(
        { subscription_status: "active", plan: "growth" },
        "barcodeScanning",
      ),
    ).toBe(true);
    expect(
      hasFeatureAccess(
        { subscription_status: "active", plan: "growth" },
        "auditLogs",
      ),
    ).toBe(false);
    expect(
      hasFeatureAccess(
        { subscription_status: "active", plan: "business" },
        "auditLogs",
      ),
    ).toBe(true);
  });

  it("does not let trials bypass the stored plan tier", () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    expect(
      hasFeatureAccess(
        {
          subscription_status: "trialing",
          plan: "starter",
          trial_ends_at: future,
        },
        "auditLogs",
      ),
    ).toBe(false);
  });

  it("normalizes legacy Pro to Business and unknown plans to Starter", () => {
    expect(normalizePlanId("pro")).toBe("business");
    expect(getCurrentPlan({ subscription_plan: "pro" })).toBe("business");
    expect(getCurrentPlan({ subscription_plan: "legacy" })).toBe("starter");
  });

  it("exposes new pricing, limits, annual savings, and recommendations", () => {
    expect(formatPlanPrice("starter", "month")).toBe("$0");
    expect(formatPlanPrice("growth", "month")).toBe("$9");
    expect(formatPlanPrice("business", "month")).toBe("$29");
    expect(formatPlanPrice("enterprise", "month")).toBe("Custom");
    expect(getAnnualSavingsCents("growth")).toBe(1800);
    expect(getAnnualSavingsCents("business")).toBe(5800);
    expect(getPlanLimits("starter")).toEqual({
      outlets: 1,
      registers: 1,
      users: 2,
      products: 300,
    });
    expect(hasReachedLimit("starter", "products", 300)).toBe(true);
    expect(hasReachedLimit("business", "products", 100000)).toBe(false);
    expect(getUpgradeRecommendation("barcodeScanning").plan).toBe("growth");
    expect(getUpgradeRecommendation("pharmacyExpiryTracking").plan).toBe(
      "business",
    );
    expect(normalizeBillingCycle("year")).toBe("yearly");
  });

  it("shares feature checks through the centralized pricing helper", () => {
    expect(
      canUseFeature({ subscription_status: "free", plan: "starter" }, "pos"),
    ).toBe(true);
    expect(
      canUseFeature(
        { subscription_status: "free", plan: "starter" },
        "customerAccounts",
      ),
    ).toBe(false);
  });
});
