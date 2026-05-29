"use client";

import { usePosKioskMode } from "@/hooks/use-pos-kiosk-mode";
import { useNativeSyncAlerts } from "@/hooks/use-native-sync-alerts";
import { useAppResumeSync } from "@/hooks/use-app-resume-sync";

export function PosKioskBootstrap() {
  usePosKioskMode();
  useNativeSyncAlerts();
  useAppResumeSync();
  return null;
}
