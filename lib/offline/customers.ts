import {
  bulkPutInStore,
  getAllFromStore,
  putInStore,
} from "@/lib/storage/db";
import { OfflineCustomer } from "@/types/offline";
import { updateOfflineSettings } from "@/lib/offline/offline-metadata";

export async function searchOfflineCustomers(
  query?: string,
  limit = 20,
): Promise<OfflineCustomer[]> {
  const customers = await getAllFromStore<OfflineCustomer>("customers");
  const active = customers.filter((c) => Boolean(c.full_name?.trim()));

  if (!query?.trim()) {
    return active.slice(0, limit);
  }

  const term = query.trim().toLowerCase();
  const { normalizeLoyaltyCardNumber } = await import("@/lib/loyalty/card");
  const normalizedCard = normalizeLoyaltyCardNumber(query);
  return active
    .filter(
      (c) =>
        c.full_name.toLowerCase().includes(term) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (normalizedCard.length > 0 &&
          normalizeLoyaltyCardNumber(c.loyalty_card_number ?? "") ===
            normalizedCard),
    )
    .slice(0, limit);
}

export async function getOfflineCustomerById(
  id: string,
): Promise<OfflineCustomer | null> {
  const customers = await getAllFromStore<OfflineCustomer>("customers");
  return customers.find((c) => c.id === id) ?? null;
}

export async function getOfflineCustomerByLoyaltyCard(
  cardNumber: string,
  organizationId: string,
): Promise<OfflineCustomer | null> {
  const { normalizeLoyaltyCardNumber } = await import("@/lib/loyalty/card");
  const normalized = normalizeLoyaltyCardNumber(cardNumber);
  const customers = await getAllFromStore<OfflineCustomer>("customers");
  return (
    customers.find(
      (customer) =>
        customer.organization_id === organizationId &&
        normalizeLoyaltyCardNumber(customer.loyalty_card_number ?? "") ===
          normalized,
    ) ?? null
  );
}

export async function cacheCustomersDelta(
  rows: OfflineCustomer[],
  fullReplace = false,
) {
  if (fullReplace) {
    await bulkPutInStore("customers", rows);
  } else {
    for (const row of rows) {
      await putInStore("customers", row);
    }
  }

  await updateOfflineSettings({
    customersLastSyncedAt: new Date().toISOString(),
  });
}
