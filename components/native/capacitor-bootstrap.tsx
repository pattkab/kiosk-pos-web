"use client";

import { useCapacitorApp } from "@/hooks/use-capacitor-app";
import { AppReviewPrompt } from "@/components/native/app-review-prompt";

/** Registers Capacitor native listeners when the app runs inside the Android/iOS shell. */
export function CapacitorBootstrap() {
  useCapacitorApp();
  return <AppReviewPrompt />;
}
