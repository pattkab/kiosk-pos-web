import { create } from "zustand";

export type ConnectivityStatus = "online" | "offline" | "reconnecting" | "limited-functionality";

interface ConnectivityState {
  status: ConnectivityStatus;
  lastChangedAt: string;
  setStatus: (status: ConnectivityStatus) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  // Default to online during SSR/hydration to avoid false offline flash banners.
  status: typeof window !== "undefined" ? (navigator.onLine ? "online" : "offline") : "online",
  lastChangedAt: new Date().toISOString(),
  setStatus: (status) =>
    set({
      status,
      lastChangedAt: new Date().toISOString(),
    }),
}));
