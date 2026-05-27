"use client";

import { useSyncEngine } from "@/hooks/use-sync-engine";
import { useConnectivity } from "@/hooks/use-connectivity";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useConnectivity();
  useSyncEngine();

  return <>{children}</>;
}
