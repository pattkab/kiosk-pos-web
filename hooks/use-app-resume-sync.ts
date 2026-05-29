"use client";

import { useEffect } from "react";
import { isCapacitorNative } from "@/lib/utils/capacitor";
import { SyncEngine } from "@/lib/offline/sync-engine";

/** When the native app returns to foreground, retry offline sync. */
export function useAppResumeSync() {
  useEffect(() => {
    if (!isCapacitorNative()) return;

    let removeListener: (() => void) | undefined;

    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            void SyncEngine.processQueue();
          }
        });
        removeListener = () => handle.remove();
      } catch {
        /* optional */
      }
    })();

    return () => removeListener?.();
  }, []);
}
