"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { SyncEngine } from "@/lib/offline/sync-engine";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";
import { useOrganizationStore } from "@/store/use-organization-store";
import { InstallPrompt } from "@/components/layout/install-prompt";

const PwaContext = createContext<any>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const connectivity = useConnectivity();
  const loadQueue = useOfflineQueueStore((state) => state.loadQueue);
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);

  // 1. Load Queue and Register Service Worker on mount
  useEffect(() => {
    loadQueue();

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    }
  }, [loadQueue]);

  // 2. Trigger synchronization on transition to online
  useEffect(() => {
    if (connectivity.isOnline) {
      console.log("[PwaProvider] Network online detected. Triggering queue sync...");
      SyncEngine.processQueue();
      SyncEngine.syncProductCatalog();
    }
  }, [connectivity.isOnline, activeOrganizationId]);

  // 3. Pre-fetch catalog initially if online
  useEffect(() => {
    if (connectivity.isOnline && activeOrganizationId) {
      SyncEngine.syncProductCatalog();
    }
  }, [activeOrganizationId, connectivity.isOnline]);

  return (
    <PwaContext.Provider value={{ ...connectivity }}>
      {children}
      <InstallPrompt />
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used within a PwaProvider");
  }
  return context;
}
