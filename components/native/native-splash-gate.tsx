"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isCapacitorNative } from "@/lib/utils/capacitor";
import {
  signalNativeAppReady,
  waitForInitialRouteStable,
  waitForRouteReady,
} from "@/lib/native/splash-screen";

/**
 * Keeps the native splash visible until the current route has painted meaningful content.
 */
export function NativeSplashGate() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (!isCapacitorNative() || window.__kioskposAppReady) return;

    let cancelled = false;

    void (async () => {
      try {
        const stablePath = await waitForInitialRouteStable(
          () => pathnameRef.current,
        );
        if (cancelled || window.__kioskposAppReady) return;

        await waitForRouteReady(stablePath);
        if (cancelled || window.__kioskposAppReady) return;

        signalNativeAppReady();
      } catch {
        if (!cancelled) {
          signalNativeAppReady();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
