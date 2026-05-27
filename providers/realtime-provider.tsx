"use client";

import { useEffect } from "react";
import { usePresence } from "@/hooks/use-presence";
import { useRealtimeDashboard } from "@/hooks/use-realtime-dashboard";
import { useRealtimeStore } from "@/store/use-realtime-store";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const setActiveChannels = useRealtimeStore((state) => state.setActiveChannels);

  useRealtimeDashboard();
  usePresence();

  useEffect(() => {
    setActiveChannels(["inventory", "sales", "notifications", "presence"]);
    return () => setActiveChannels([]);
  }, [setActiveChannels]);

  return <>{children}</>;
}
