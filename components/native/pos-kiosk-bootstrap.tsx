"use client";

import { usePosKioskMode } from "@/hooks/use-pos-kiosk-mode";
import { useNativeSyncAlerts } from "@/hooks/use-native-sync-alerts";

export function PosKioskBootstrap() {
  usePosKioskMode();
  useNativeSyncAlerts();
  return null;
}
