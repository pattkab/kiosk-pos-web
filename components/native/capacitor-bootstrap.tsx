"use client";

import { useCapacitorApp } from "@/hooks/use-capacitor-app";

/** Registers Capacitor native listeners when the app runs inside the Android/iOS shell. */
export function CapacitorBootstrap() {
  useCapacitorApp();
  return null;
}
