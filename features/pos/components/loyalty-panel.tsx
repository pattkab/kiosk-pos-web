"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useOrganizationSettings } from "@/hooks/use-organization";
import {
  applyLoyaltyRedemption,
  maxRedeemablePoints,
  parseLoyaltySettings,
} from "@/lib/loyalty/calculations";
import { canUseFeature } from "@/lib/billing/plans";
import { formatCurrency } from "@/lib/utils";
import { Gift, Sparkles } from "lucide-react";

export function LoyaltyPanel({
  cartTotal,
  disabled,
}: {
  cartTotal: number;
  disabled?: boolean;
}) {
  const settingsQuery = useOrganizationSettings();
  const {
    selectedCustomerId,
    selectedCustomerPoints,
    loyaltyPointsToRedeem,
    setLoyaltyPointsToRedeem,
  } = useCheckoutStore();

  const loyaltySettings = parseLoyaltySettings(settingsQuery.data);
  const canUseLoyalty = canUseFeature(settingsQuery.data, "customerAccounts");

  const redemption = useMemo(
    () =>
      applyLoyaltyRedemption(
        cartTotal,
        loyaltyPointsToRedeem,
        selectedCustomerPoints,
        loyaltySettings,
      ),
    [
      cartTotal,
      loyaltyPointsToRedeem,
      selectedCustomerPoints,
      loyaltySettings,
    ],
  );

  const maxPoints = maxRedeemablePoints(
    cartTotal,
    selectedCustomerPoints,
    loyaltySettings,
  );

  if (!canUseLoyalty || !loyaltySettings.loyalty_enabled || !selectedCustomerId) {
    return null;
  }

  return (
    <div className="space-y-3 border-b px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
          <Gift className="h-3.5 w-3.5" />
          Loyalty
        </Label>
        <Badge variant="secondary" className="font-black">
          {selectedCustomerPoints.toLocaleString()} pts
        </Badge>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 text-sm">
        <div className="flex items-center gap-2 text-emerald-700">
          <Sparkles className="h-4 w-4" />
          <span>
            Earn about{" "}
            <strong>{redemption.pointsEarnedPreview.toLocaleString()}</strong>{" "}
            points on this order
          </span>
        </div>
      </div>

      {selectedCustomerPoints >= loyaltySettings.loyalty_min_redeem_points ? (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="loyalty-redeem" className="text-xs">
                Redeem points
              </Label>
              <Input
                id="loyalty-redeem"
                type="number"
                min={0}
                max={maxPoints}
                disabled={disabled}
                value={loyaltyPointsToRedeem || ""}
                onChange={(event) =>
                  setLoyaltyPointsToRedeem(Number(event.target.value || 0))
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || maxPoints <= 0}
              onClick={() => setLoyaltyPointsToRedeem(maxPoints)}
            >
              Max
            </Button>
          </div>
          {redemption.loyaltyDiscount > 0 ? (
            <p className="text-xs text-muted-foreground">
              Redeeming {redemption.pointsRedeemed.toLocaleString()} points →{" "}
              <span className="font-bold text-foreground">
                -{formatCurrency(redemption.loyaltyDiscount)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Min redeem: {loyaltySettings.loyalty_min_redeem_points} points
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Need {loyaltySettings.loyalty_min_redeem_points} points before redeeming.
        </p>
      )}
    </div>
  );
}

export function useCheckoutPayableTotal(cartTotal: number) {
  const settingsQuery = useOrganizationSettings();
  const {
    selectedCustomerId,
    selectedCustomerPoints,
    loyaltyPointsToRedeem,
  } = useCheckoutStore();
  const loyaltySettings = parseLoyaltySettings(settingsQuery.data);

  return useMemo(() => {
    if (!selectedCustomerId || !loyaltySettings.loyalty_enabled) {
      return {
        payableTotal: cartTotal,
        loyaltyDiscount: 0,
        pointsRedeemed: 0,
        pointsEarnedPreview: 0,
      };
    }

    const result = applyLoyaltyRedemption(
      cartTotal,
      loyaltyPointsToRedeem,
      selectedCustomerPoints,
      loyaltySettings,
    );

    return {
      payableTotal: result.payableTotal,
      loyaltyDiscount: result.loyaltyDiscount,
      pointsRedeemed: result.pointsRedeemed,
      pointsEarnedPreview: result.pointsEarnedPreview,
    };
  }, [
    cartTotal,
    loyaltyPointsToRedeem,
    loyaltySettings,
    selectedCustomerId,
    selectedCustomerPoints,
  ]);
}
