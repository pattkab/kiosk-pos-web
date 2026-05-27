import { QueryClient } from "@tanstack/react-query";

type InvalidationKey =
  | "products"
  | "inventory"
  | "sales"
  | "reports"
  | "dashboard"
  | "alerts"
  | "sessions"
  | "activity";

const queryKeys: Record<InvalidationKey, string[][]> = {
  products: [["products"], ["pos-products"]],
  inventory: [["products"], ["inventory-history"], ["analytics"], ["reports"]],
  sales: [["analytics"], ["reports"], ["active-register-session"]],
  reports: [["reports"], ["analytics"]],
  dashboard: [["analytics"], ["reports"]],
  alerts: [["alerts"], ["notifications"]],
  sessions: [["active-register-session"], ["reports"], ["analytics"]],
  activity: [["activity"], ["reports"]],
};

const timers = new WeakMap<QueryClient, ReturnType<typeof setTimeout>>();
const pending = new WeakMap<QueryClient, Set<InvalidationKey>>();

export function batchInvalidate(queryClient: QueryClient, keys: InvalidationKey[]) {
  const current = pending.get(queryClient) ?? new Set<InvalidationKey>();
  keys.forEach((key) => current.add(key));
  pending.set(queryClient, current);

  const existingTimer = timers.get(queryClient);
  if (existingTimer) clearTimeout(existingTimer);

  timers.set(
    queryClient,
    setTimeout(() => {
      const keysToFlush = pending.get(queryClient) ?? new Set<InvalidationKey>();
      keysToFlush.forEach((key) => {
        queryKeys[key].forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      });
      pending.delete(queryClient);
      timers.delete(queryClient);
    }, 250)
  );
}
