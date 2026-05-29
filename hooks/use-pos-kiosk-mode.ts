"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isCapacitorNative } from "@/lib/utils/capacitor";

export const KEEP_AWAKE_STORAGE_KEY = "kiosk-native-keep-awake";

export function isKeepAwakeEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEEP_AWAKE_STORAGE_KEY) !== "false";
}

/** Keep the screen on while on POS routes (shop-floor kiosk behaviour). */
export function usePosKioskMode() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isCapacitorNative() || !pathname.startsWith("/pos")) return;
    if (!isKeepAwakeEnabled()) return;

    let cancelled = false;

    void (async () => {
      try {
        const { KeepAwake } = await import("@capacitor-community/keep-awake");
        if (cancelled) return;
        await KeepAwake.keepAwake();
      } catch (error) {
        console.warn("[KioskMode] Keep awake unavailable:", error);
      }
    })();

    return () => {
      cancelled = true;
      void (async () => {
        try {
          const { KeepAwake } = await import("@capacitor-community/keep-awake");
          await KeepAwake.allowSleep();
        } catch {
          /* ignore */
        }
      })();
    };
  }, [pathname]);
}
