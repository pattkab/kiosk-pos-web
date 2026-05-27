import { Role } from "@/lib/auth/permissions";
import { create } from "zustand";

interface TeamState {
  inviteOpen: boolean;
  editingMemberId: string | null;
  pendingRemovalId: string | null;
  selectedRole: Role;
  setInviteOpen: (open: boolean) => void;
  setEditingMemberId: (id: string | null) => void;
  setPendingRemovalId: (id: string | null) => void;
  setSelectedRole: (role: Role) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  inviteOpen: false,
  editingMemberId: null,
  pendingRemovalId: null,
  selectedRole: "cashier",
  setInviteOpen: (inviteOpen) => set({ inviteOpen }),
  setEditingMemberId: (editingMemberId) => set({ editingMemberId }),
  setPendingRemovalId: (pendingRemovalId) => set({ pendingRemovalId }),
  setSelectedRole: (selectedRole) => set({ selectedRole }),
}));
