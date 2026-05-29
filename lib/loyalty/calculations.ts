export type LoyaltyProgramSettings = {
  loyalty_enabled: boolean;
  loyalty_earn_points_per_unit: number;
  loyalty_earn_spend_unit: number;
  loyalty_redeem_points_unit: number;
  loyalty_redeem_value_unit: number;
  loyalty_min_redeem_points: number;
  loyalty_max_redeem_percent: number;
};

export const DEFAULT_LOYALTY_SETTINGS: LoyaltyProgramSettings = {
  loyalty_enabled: false,
  loyalty_earn_points_per_unit: 1,
  loyalty_earn_spend_unit: 1000,
  loyalty_redeem_points_unit: 100,
  loyalty_redeem_value_unit: 1,
  loyalty_min_redeem_points: 100,
  loyalty_max_redeem_percent: 50,
};

export function parseLoyaltySettings(
  source: Partial<LoyaltyProgramSettings> | null | undefined,
): LoyaltyProgramSettings {
  return {
    loyalty_enabled: Boolean(source?.loyalty_enabled),
    loyalty_earn_points_per_unit: Math.max(
      1,
      Number(source?.loyalty_earn_points_per_unit ?? DEFAULT_LOYALTY_SETTINGS.loyalty_earn_points_per_unit),
    ),
    loyalty_earn_spend_unit: Math.max(
      0.01,
      Number(source?.loyalty_earn_spend_unit ?? DEFAULT_LOYALTY_SETTINGS.loyalty_earn_spend_unit),
    ),
    loyalty_redeem_points_unit: Math.max(
      1,
      Number(source?.loyalty_redeem_points_unit ?? DEFAULT_LOYALTY_SETTINGS.loyalty_redeem_points_unit),
    ),
    loyalty_redeem_value_unit: Math.max(
      0.01,
      Number(source?.loyalty_redeem_value_unit ?? DEFAULT_LOYALTY_SETTINGS.loyalty_redeem_value_unit),
    ),
    loyalty_min_redeem_points: Math.max(
      1,
      Number(source?.loyalty_min_redeem_points ?? DEFAULT_LOYALTY_SETTINGS.loyalty_min_redeem_points),
    ),
    loyalty_max_redeem_percent: Math.min(
      100,
      Math.max(
        1,
        Number(source?.loyalty_max_redeem_percent ?? DEFAULT_LOYALTY_SETTINGS.loyalty_max_redeem_percent),
      ),
    ),
  };
}

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function loyaltyDiscountForPoints(
  points: number,
  settings: LoyaltyProgramSettings,
): number {
  if (points <= 0) return 0;
  return roundMoney(
    (points / settings.loyalty_redeem_points_unit) *
      settings.loyalty_redeem_value_unit,
  );
}

export function maxRedeemablePoints(
  orderTotal: number,
  availablePoints: number,
  settings: LoyaltyProgramSettings,
): number {
  if (!settings.loyalty_enabled || orderTotal <= 0 || availablePoints <= 0) {
    return 0;
  }

  const maxDiscount = roundMoney(
    (orderTotal * settings.loyalty_max_redeem_percent) / 100,
  );
  const pointsForMaxDiscount = Math.floor(
    (maxDiscount / settings.loyalty_redeem_value_unit) *
      settings.loyalty_redeem_points_unit,
  );

  return Math.max(0, Math.min(availablePoints, pointsForMaxDiscount));
}

export function pointsEarnedForAmount(
  amount: number,
  settings: LoyaltyProgramSettings,
): number {
  if (!settings.loyalty_enabled || amount <= 0) return 0;
  return Math.floor(
    (amount / settings.loyalty_earn_spend_unit) *
      settings.loyalty_earn_points_per_unit,
  );
}

export function applyLoyaltyRedemption(
  cartTotal: number,
  pointsToRedeem: number,
  availablePoints: number,
  settings: LoyaltyProgramSettings,
) {
  const cappedPoints = Math.min(
    Math.max(0, pointsToRedeem),
    maxRedeemablePoints(cartTotal, availablePoints, settings),
  );

  if (
    cappedPoints > 0 &&
    cappedPoints < settings.loyalty_min_redeem_points
  ) {
    return {
      pointsRedeemed: 0,
      loyaltyDiscount: 0,
      payableTotal: cartTotal,
      pointsEarnedPreview: pointsEarnedForAmount(cartTotal, settings),
    };
  }

  const loyaltyDiscount = loyaltyDiscountForPoints(cappedPoints, settings);
  const payableTotal = roundMoney(Math.max(0, cartTotal - loyaltyDiscount));

  return {
    pointsRedeemed: cappedPoints,
    loyaltyDiscount,
    payableTotal,
    pointsEarnedPreview: pointsEarnedForAmount(payableTotal, settings),
  };
}
