"use client";

import { useEffect } from 'react';
import { useConnectivityStore } from '@/store/use-connectivity-store';
import { useSyncStore } from '@/store/use-sync-store';

export function useConnectivity() {
  const status = useConnectivityStore((state) => state.status);
  const lastChangedAt = useConnectivityStore((state) => state.lastChangedAt);
  const setStatus = useConnectivityStore((state) => state.setStatus);
  const isOnline = status === "online" || status === "limited-functionality";
  const setOnline = useSyncStore((state) => state.setOnline);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setStatus("online");
    };
    const handleOffline = () => {
      setOnline(false);
      setStatus("offline");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, setStatus]);

  return { isOnline, status, lastChangedAt };
}
