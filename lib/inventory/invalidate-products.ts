import type { QueryClient } from "@tanstack/react-query";

export const inventoryProductQueryKeys = [
  ["products"],
  ["products-infinite"],
  ["pos-products"],
] as const;

export function invalidateInventoryProducts(queryClient: QueryClient) {
  for (const queryKey of inventoryProductQueryKeys) {
    queryClient.invalidateQueries({ queryKey });
  }
}
