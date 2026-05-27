import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  isSyncing: boolean;
  setSyncing: (syncing: boolean) => void;

  pendingCount: number;
  setPendingCount: (count: number) => void;

  lastSyncedAt: Date | null;
  setLastSyncedAt: (date: Date) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,
  setOnline: (isOnline) => set({ isOnline }),

  isSyncing: false,
  setSyncing: (isSyncing) => set({ isSyncing }),

  pendingCount: 0,
  setPendingCount: (pendingCount) => set({ pendingCount }),

  lastSyncedAt: null,
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));
