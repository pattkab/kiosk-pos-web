import { Role, Permission } from "@/lib/auth/permissions";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrganizationState {
  activeOrganizationId: string | null;
  activeCurrency: string;
  role: Role | null;
  permissions: Permission[];
  setActiveOrganizationId: (id: string | null) => void;
  setActiveCurrency: (currency: string | null | undefined) => void;
  setPermissionState: (role: Role | null, permissions: Permission[]) => void;
  clearOrganizationState: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      activeOrganizationId: null,
      activeCurrency: "USD",
      role: null,
      permissions: [],
      setActiveOrganizationId: (activeOrganizationId) => set({ activeOrganizationId }),
      setActiveCurrency: (currency) => set({ activeCurrency: currency || "USD" }),
      setPermissionState: (role, permissions) => set({ role, permissions }),
      clearOrganizationState: () => set({ activeOrganizationId: null, activeCurrency: "USD", role: null, permissions: [] }),
    }),
    {
      name: "active-organization-storage",
      partialize: (state) => ({ activeOrganizationId: state.activeOrganizationId, activeCurrency: state.activeCurrency }),
    }
  )
);
