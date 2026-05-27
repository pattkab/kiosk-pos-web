import { ActiveRegisterSession } from "@/types/pos";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionState {
  currentSession: ActiveRegisterSession | null;
  isClosingRegister: boolean;
  setSession: (session: ActiveRegisterSession | null) => void;
  clearSession: () => void;
  setIsClosingRegister: (isClosingRegister: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSession: null,
      isClosingRegister: false,
      setSession: (session) => set({ currentSession: session }),
      clearSession: () => set({ currentSession: null }),
      setIsClosingRegister: (isClosingRegister) => set({ isClosingRegister }),
    }),
    {
      name: "register-session-storage",
      version: 2,
    }
  )
);
