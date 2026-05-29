"use client";

import { useEffect, useState } from "react";
import { getCapacitorPlatform, isCapacitorNative } from "@/lib/utils/capacitor";

const DETECT_DELAYS_MS = [0, 50, 150, 400, 800, 1500];

/**
 * Client-only native shell detection (avoids SSR mismatch; retries until Capacitor bridge is ready).
 */
export function useNativeShell() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const detect = () => {
      if (isCapacitorNative()) {
        setIsNative(true);
        return true;
      }
      return false;
    };

    if (detect()) return;

    const timers = DETECT_DELAYS_MS.map((delay) =>
      window.setTimeout(() => {
        detect();
      }, delay)
    );

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  return {
    isNative,
    platform: isNative ? getCapacitorPlatform() : ("web" as const),
  };
}
