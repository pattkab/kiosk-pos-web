import {
  ActiveRealtimeNotification,
  LiveActivity,
  OnlineUser,
  RealtimeConflict,
  RealtimeConnectionStatus,
  SyncStatus,
} from "@/types/realtime";
import { create } from "zustand";

interface RealtimeState {
  connectionStatus: RealtimeConnectionStatus;
  syncStatus: SyncStatus;
  onlineUsers: OnlineUser[];
  notifications: ActiveRealtimeNotification[];
  conflicts: RealtimeConflict[];
  activityFeed: LiveActivity[];
  activeChannels: string[];
  lastSyncedAt: string | null;
  setConnectionStatus: (status: RealtimeConnectionStatus) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  upsertNotification: (notification: ActiveRealtimeNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  setNotifications: (notifications: ActiveRealtimeNotification[]) => void;
  addConflict: (conflict: Omit<RealtimeConflict, "id" | "createdAt" | "resolved">) => void;
  resolveConflict: (id: string) => void;
  clearResolvedConflicts: () => void;
  addActivity: (activity: LiveActivity) => void;
  setActiveChannels: (channels: string[]) => void;
  markSynced: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connectionStatus: "idle",
  syncStatus: "idle",
  onlineUsers: [],
  notifications: [],
  conflicts: [],
  activityFeed: [],
  activeChannels: [],
  lastSyncedAt: null,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  upsertNotification: (notification) =>
    set((state) => ({
      notifications: [
        notification,
        ...state.notifications.filter((entry) => entry.id !== notification.id),
      ].slice(0, 50),
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((entry) =>
        entry.id === id ? { ...entry, read: true } : entry
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((entry) => ({ ...entry, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
  setNotifications: (notifications) => set({ notifications }),
  addConflict: (conflict) =>
    set((state) => ({
      conflicts: [
        {
          ...conflict,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          resolved: false,
        },
        ...state.conflicts,
      ].slice(0, 20),
    })),
  resolveConflict: (id) =>
    set((state) => ({
      conflicts: state.conflicts.map((entry) =>
        entry.id === id ? { ...entry, resolved: true } : entry
      ),
    })),
  clearResolvedConflicts: () =>
    set((state) => ({ conflicts: state.conflicts.filter((entry) => !entry.resolved) })),
  addActivity: (activity) =>
    set((state) => ({
      activityFeed: [activity, ...state.activityFeed.filter((entry) => entry.id !== activity.id)].slice(0, 40),
    })),
  setActiveChannels: (activeChannels) => set({ activeChannels }),
  markSynced: () =>
    set({
      syncStatus: "synced",
      lastSyncedAt: new Date().toISOString(),
    }),
}));
