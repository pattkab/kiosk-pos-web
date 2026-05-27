"use client";

import { useEffect } from "react";
import { useConnectivityStore } from "@/store/use-connectivity-store";
import { useSyncStore } from "@/store/use-sync-store";
import { SyncEngine } from "@/lib/offline/sync-engine";
import { prefetchOfflineEssentials } from "@/lib/offline/prefetch";

const CONNECTION_CHECK_TIMEOUT_MS = 4000;
const CONNECTION_RECHECK_INTERVAL_MS = 30000;

async function canReachApp() {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    CONNECTION_CHECK_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`/api/ping?t=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useConnectivity() {
  const status = useConnectivityStore((state) => state.status);
  const lastChangedAt = useConnectivityStore((state) => state.lastChangedAt);
  const setStatus = useConnectivityStore((state) => state.setStatus);
  const isOnline =
    status === "online" ||
    status === "limited-functionality" ||
    status === "reconnecting";
  const setOnline = useSyncStore((state) => state.setOnline);

  useEffect(() => {
    let disposed = false;

    const verifyAndSync = async () => {
      setOnline(true);
      setStatus("reconnecting");

      const reachable = await canReachApp();
      if (disposed) return;

      if (!reachable) {
        setStatus(
          window.navigator.onLine ? "limited-functionality" : "offline",
        );
        return;
      }

      try {
        setStatus("online");
        await SyncEngine.processQueue();
        await prefetchOfflineEssentials();
      } catch {
        if (!disposed) setStatus("limited-functionality");
      }
    };

    const handleOnline = () => {
      void verifyAndSync();
    };
    const handleOffline = () => {
      setOnline(false);
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (window.navigator.onLine) {
      void verifyAndSync();
    } else {
      handleOffline();
    }

    const interval = window.setInterval(() => {
      if (
        window.navigator.onLine &&
        useConnectivityStore.getState().status !== "online"
      ) {
        void verifyAndSync();
      }
    }, CONNECTION_RECHECK_INTERVAL_MS);

    return () => {
      disposed = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(interval);
    };
  }, [setOnline, setStatus]);

  return { isOnline, status, lastChangedAt };
}
