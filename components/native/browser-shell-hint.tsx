"use client";

import { useEffect, useState } from "react";
import { isCapacitorNative } from "@/lib/utils/capacitor";

/**
 * Shown when the user is in a browser-installed PWA (Chrome shell), not the Capacitor APK.
 */
export function BrowserShellHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isCapacitorNative()) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setShow(standalone);
  }, []);

  if (!show) return null;

  return (
    <div
      className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
      role="status"
    >
      You are in the <strong>browser app</strong> (Chrome), not the native Android
      APK. Install and open <strong>Kiosk POS</strong> from your app drawer for the
      full native shell (bottom navigation, no browser UI).
    </div>
  );
}
