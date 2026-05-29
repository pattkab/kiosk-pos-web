import type { CustomerRecord } from "@/hooks/use-customers";

export function customerToCheckoutSelection(customer: CustomerRecord) {
  return {
    id: customer.id,
    name: customer.full_name,
    points: Number(customer.loyalty_points ?? 0),
    cardNumber: customer.loyalty_card_number,
  };
}
