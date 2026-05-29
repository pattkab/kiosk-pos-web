"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyCustomerMemberships } from "@/hooks/use-my-loyalty";
import { formatLoyaltyCardNumber } from "@/lib/loyalty/card";
import { LoyaltyQrCode } from "@/features/loyalty/components/loyalty-qr-code";
import { Gift, ScanBarcode } from "lucide-react";

export function MyLoyaltyPage() {
  const membershipsQuery = useMyCustomerMemberships();
  const memberships = membershipsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My loyalty cards</h1>
        <p className="text-sm text-muted-foreground">
          Show this barcode at checkout so the cashier can attach your account, earn points, and redeem rewards.
        </p>
      </div>

      {membershipsQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Loading your loyalty cards…
          </CardContent>
        </Card>
      ) : memberships.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No loyalty cards yet</CardTitle>
            <CardDescription>
              Ask a shop to invite you by email or phone. After you sign in, your card appears here automatically.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        memberships.map((membership) => (
          <Card key={membership.customer_id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {membership.organization_name}
              </CardTitle>
              <CardDescription>{membership.full_name}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
              <LoyaltyQrCode value={membership.loyalty_card_number} />
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Scan at checkout
                  </p>
                  <p className="mt-2 font-mono text-2xl font-black tracking-wider">
                    {formatLoyaltyCardNumber(membership.loyalty_card_number)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-base font-black">
                  {Number(membership.loyalty_points).toLocaleString()} points
                </Badge>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ScanBarcode className="h-4 w-4" />
                  Cashier scans this code in POS to apply your loyalty account.
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
