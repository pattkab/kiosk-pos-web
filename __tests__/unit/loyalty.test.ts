import { describe, expect, it } from "vitest";
import {
  applyLoyaltyRedemption,
  loyaltyDiscountForPoints,
  maxRedeemablePoints,
  parseLoyaltySettings,
  pointsEarnedForAmount,
} from "@/lib/loyalty/calculations";

const settings = parseLoyaltySettings({
  loyalty_enabled: true,
  loyalty_earn_points_per_unit: 1,
  loyalty_earn_spend_unit: 1000,
  loyalty_redeem_points_unit: 100,
  loyalty_redeem_value_unit: 1,
  loyalty_min_redeem_points: 100,
  loyalty_max_redeem_percent: 50,
});

describe("loyalty calculations", () => {
  it("calculates earn points from spend amount", () => {
    expect(pointsEarnedForAmount(2500, settings)).toBe(2);
  });

  it("converts points to discount value", () => {
    expect(loyaltyDiscountForPoints(250, settings)).toBe(2.5);
  });

  it("caps redeemable points by order total and balance", () => {
    expect(maxRedeemablePoints(100, 500, settings)).toBe(500);
    expect(maxRedeemablePoints(100, 10000, settings)).toBe(5000);
  });

  it("applies redemption and previews earn on payable total", () => {
    const result = applyLoyaltyRedemption(5000, 500, 1000, settings);
    expect(result.loyaltyDiscount).toBe(5);
    expect(result.payableTotal).toBe(4995);
    expect(result.pointsRedeemed).toBe(500);
    expect(result.pointsEarnedPreview).toBe(4);
  });

  it("ignores redemption below minimum threshold", () => {
    const result = applyLoyaltyRedemption(5000, 50, 1000, settings);
    expect(result.pointsRedeemed).toBe(0);
    expect(result.loyaltyDiscount).toBe(0);
  });
});
