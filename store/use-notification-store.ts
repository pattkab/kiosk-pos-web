import { AlertFilters, AlertPriority, OperationalAlertType } from "@/types/notifications";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationUiState {
  filters: AlertFilters;
  acknowledgementAlertId: string | null;
  toastQueue: string[];
  enabledTypes: OperationalAlertType[];
  minimumPriority: AlertPriority;
  setFilters: (filters: Partial<AlertFilters>) => void;
  resetFilters: () => void;
  setAcknowledgementAlertId: (id: string | null) => void;
  enqueueToast: (id: string) => void;
  dequeueToast: (id: string) => void;
  setPreferenceDraft: (values: { enabledTypes: OperationalAlertType[]; minimumPriority: AlertPriority }) => void;
}

const defaultFilters: AlertFilters = {
  type: "all",
  priority: "all",
  status: "open",
  search: "",
};

export const useNotificationStore = create<NotificationUiState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      acknowledgementAlertId: null,
      toastQueue: [],
      enabledTypes: [
        "low_stock",
        "expiring_soon",
        "expired",
        "failed_sale",
        "register_discrepancy",
        "inventory_adjustment",
        "user_activity",
        "daily_summary",
        "system",
      ],
      minimumPriority: "low",
      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
      resetFilters: () => set({ filters: defaultFilters }),
      setAcknowledgementAlertId: (acknowledgementAlertId) => set({ acknowledgementAlertId }),
      enqueueToast: (id) =>
        set((state) => ({
          toastQueue: state.toastQueue.includes(id) ? state.toastQueue : [...state.toastQueue, id],
        })),
      dequeueToast: (id) =>
        set((state) => ({ toastQueue: state.toastQueue.filter((entry) => entry !== id) })),
      setPreferenceDraft: ({ enabledTypes, minimumPriority }) => set({ enabledTypes, minimumPriority }),
    }),
    {
      name: "notification-ui-storage",
      partialize: (state) => ({
        enabledTypes: state.enabledTypes,
        minimumPriority: state.minimumPriority,
      }),
    }
  )
);
