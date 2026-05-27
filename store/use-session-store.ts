import { ActiveRegisterSession } from "@/types/pos";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionState {
  currentSession: ActiveRegisterSession | null;
  isClosingRegister: boolean;
  isOpeningRegister: boolean;
  setSession: (session: ActiveRegisterSession | null) => void;
  clearSession: () => void;
  setIsClosingRegister: (isClosingRegister: boolean) => void;
  setIsOpeningRegister: (isOpeningRegister: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentSession: null,
      isClosingRegister: false,
      isOpeningRegister: false,
      setSession: (session) => set({ currentSession: session, isOpeningRegister: false }),
      clearSession: () => set({ currentSession: null }),
      setIsClosingRegister: (isClosingRegister) => set({ isClosingRegister }),
      setIsOpeningRegister: (isOpeningRegister) => set({ isOpeningRegister }),
    }),
    {
      name: "register-session-storage",
      version: 2,
    }
  )
);
