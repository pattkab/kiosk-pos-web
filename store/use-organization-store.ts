import { Role, Permission } from "@/lib/auth/permissions";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrganizationState {
  activeOrganizationId: string | null;
  role: Role | null;
  permissions: Permission[];
  setActiveOrganizationId: (id: string | null) => void;
  setPermissionState: (role: Role | null, permissions: Permission[]) => void;
  clearOrganizationState: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      activeOrganizationId: null,
      role: null,
      permissions: [],
      setActiveOrganizationId: (activeOrganizationId) => set({ activeOrganizationId }),
      setPermissionState: (role, permissions) => set({ role, permissions }),
      clearOrganizationState: () => set({ activeOrganizationId: null, role: null, permissions: [] }),
    }),
    {
      name: "active-organization-storage",
      partialize: (state) => ({ activeOrganizationId: state.activeOrganizationId }),
    }
  )
);
