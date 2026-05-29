"use client";

import { useEffect, useRef } from "react";
import { isCapacitorNative } from "@/lib/utils/capacitor";
import { notifyNativeSyncFailure } from "@/lib/native/native-notifications";
import { useOfflineQueueStore } from "@/store/use-offline-queue-store";

/** Surface native notifications when offline sales fail or conflict. */
export function useNativeSyncAlerts() {
  const failedCount = useOfflineQueueStore(
    (state) =>
      state.items.filter(
        (item) => item.status === "failed" || item.status === "conflict",
      ).length,
  );
  const previousCount = useRef(0);

  useEffect(() => {
    if (!isCapacitorNative()) return;

    if (failedCount > previousCount.current && failedCount > 0) {
      const delta = failedCount - previousCount.current;
      void notifyNativeSyncFailure(
        `${delta} offline sale${delta === 1 ? "" : "s"} need attention. Open Sync queue to resolve.`,
      );
    }

    previousCount.current = failedCount;
  }, [failedCount]);
}
