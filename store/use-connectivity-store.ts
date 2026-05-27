import { create } from "zustand";

export type ConnectivityStatus = "online" | "offline" | "reconnecting" | "limited-functionality";

interface ConnectivityState {
  status: ConnectivityStatus;
  lastChangedAt: string;
  setStatus: (status: ConnectivityStatus) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  status: typeof window !== "undefined" && navigator.onLine ? "online" : "offline",
  lastChangedAt: new Date().toISOString(),
  setStatus: (status) =>
    set({
      status,
      lastChangedAt: new Date().toISOString(),
    }),
}));
