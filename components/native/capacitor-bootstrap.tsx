"use client";

import { useCapacitorApp } from "@/hooks/use-capacitor-app";
import { AppReviewPrompt } from "@/components/native/app-review-prompt";
import { NativeSplashGate } from "@/components/native/native-splash-gate";

/** Registers Capacitor native listeners when the app runs inside the Android/iOS shell. */
export function CapacitorBootstrap() {
  useCapacitorApp();
  return (
    <>
      <NativeSplashGate />
      <AppReviewPrompt />
    </>
  );
}
