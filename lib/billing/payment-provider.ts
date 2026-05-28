import type { BillingInterval, PlanId } from "@/lib/billing/plans";

export type CheckoutSessionRequest = {
  organizationId: string;
  planId: PlanId;
  interval: BillingInterval;
};

export type PortalSessionRequest = {
  organizationId: string;
  customerId?: string | null;
};

export type PaymentProviderResult =
  | { ok: true; url: string }
  | { ok: false; error: string; status?: number };

export interface BillingPaymentProvider {
  createCheckoutSession(
    request: CheckoutSessionRequest,
  ): Promise<PaymentProviderResult>;
  createPortalSession(
    request: PortalSessionRequest,
  ): Promise<PaymentProviderResult>;
}

export const mockPaymentProvider: BillingPaymentProvider = {
  async createCheckoutSession() {
    return {
      ok: false,
      status: 501,
      error:
        "Payment checkout is not connected yet. Plan changes are mocked until a payment provider is configured.",
    };
  },
  async createPortalSession() {
    return {
      ok: false,
      status: 501,
      error:
        "Billing portal is not connected yet. Stripe can be wired in through the payment provider adapter.",
    };
  },
};

export function getBillingPaymentProvider(): BillingPaymentProvider {
  return mockPaymentProvider;
}
