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
  return active
    .filter(
      (c) =>
        c.full_name.toLowerCase().includes(term) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)),
    )
    .slice(0, limit);
}

export async function getOfflineCustomerById(
  id: string,
): Promise<OfflineCustomer | null> {
  const customers = await getAllFromStore<OfflineCustomer>("customers");
  return customers.find((c) => c.id === id) ?? null;
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
