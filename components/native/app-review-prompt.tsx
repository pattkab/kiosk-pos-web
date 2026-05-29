"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNativeShell } from "@/hooks/use-native-shell";
import {
  APP_REVIEW_CHECK_EVENT,
  evaluateAppReviewEligibility,
  getAppReviewState,
  markAppReviewDismissed,
  markAppReviewPromptShown,
  markAppReviewRated,
  openNativeStoreListing,
  recordNativeAppSessionDay,
  requestNativeInAppReview,
  type AppReviewTrigger,
} from "@/lib/native/app-review";
import { getCapacitorPlatform } from "@/lib/utils/capacitor";

export function AppReviewPrompt() {
  const { isNative } = useNativeShell();
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<AppReviewTrigger>("manual");
  const [busy, setBusy] = useState(false);
  const platform = getCapacitorPlatform();
  const storeLabel = platform === "ios" ? "App Store" : "Google Play";

  const close = useCallback(() => setOpen(false), []);

  const showIfEligible = useCallback((nextTrigger: AppReviewTrigger) => {
    const state = getAppReviewState();
    const { eligible } = evaluateAppReviewEligibility(state, nextTrigger);
    if (!eligible) return;

    setTrigger(nextTrigger);
    setOpen(true);
    markAppReviewPromptShown();
  }, []);

  useEffect(() => {
    if (!isNative) return;

    recordNativeAppSessionDay();

    const sessionTimer = window.setTimeout(() => {
      showIfEligible("session_milestone");
    }, 4500);

    const onCheck = (event: Event) => {
      const detail = (event as CustomEvent<{ trigger?: AppReviewTrigger }>).detail;
      showIfEligible(detail?.trigger ?? "manual");
    };

    window.addEventListener(APP_REVIEW_CHECK_EVENT, onCheck);

    return () => {
      window.clearTimeout(sessionTimer);
      window.removeEventListener(APP_REVIEW_CHECK_EVENT, onCheck);
    };
  }, [isNative, showIfEligible]);

  const handleRate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await requestNativeInAppReview();
      close();
    } finally {
      setBusy(false);
    }
  };

  const handleOpenStore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await openNativeStoreListing();
      markAppReviewRated();
      close();
    } finally {
      setBusy(false);
    }
  };

  const handleLater = () => {
    markAppReviewDismissed();
    close();
  };

  const handleNever = () => {
    markAppReviewDismissed({ neverAskAgain: true });
    close();
  };

  if (!isNative || !open) return null;

  return (
    <>
      <button
        type="button"
        className="native-review-backdrop fixed inset-0 z-[70] animate-in fade-in duration-200"
        aria-label="Dismiss rating prompt"
        onClick={handleLater}
      />

      <div
        className="native-review-sheet fixed inset-x-3 z-[80] animate-in slide-in-from-bottom-8 fade-in duration-300"
        style={{ bottom: "calc(var(--native-nav-offset, 5.5rem) + 0.5rem)" }}
        role="dialog"
        aria-labelledby="app-review-title"
        aria-describedby="app-review-description"
      >
        <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#1c1f26]/95 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="relative px-5 pb-5 pt-6">
            <button
              type="button"
              onClick={handleLater}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-colors active:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 shadow-[0_8px_24px_rgba(249,115,22,0.35)]">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-4 w-4 fill-white text-white",
                      index === 4 && "opacity-80",
                    )}
                  />
                ))}
              </div>
            </div>

            <h2
              id="app-review-title"
              className="text-center text-lg font-bold tracking-tight text-white"
            >
              Enjoying Kiosk POS?
            </h2>
            <p
              id="app-review-description"
              className="mt-2 text-center text-sm leading-relaxed text-white/65"
            >
              {trigger === "checkout_success"
                ? "Your shop floor workflow is running smoothly. A quick rating helps other retailers discover Kiosk POS."
                : "Your feedback helps us improve checkout, inventory, and offline sync for shops like yours."}
            </p>

            <div className="mt-5 grid gap-2">
              <Button
                className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.35)] hover:from-orange-400 hover:to-amber-400"
                disabled={busy}
                onClick={() => void handleRate()}
              >
                Rate on {storeLabel}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                disabled={busy}
                onClick={() => void handleOpenStore()}
              >
                Open {storeLabel} listing
              </Button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="ghost"
                  className="h-10 rounded-xl text-sm text-white/70 hover:bg-white/5 hover:text-white"
                  disabled={busy}
                  onClick={handleLater}
                >
                  Not now
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 rounded-xl text-sm text-white/50 hover:bg-white/5 hover:text-white/80"
                  disabled={busy}
                  onClick={handleNever}
                >
                  Don&apos;t ask again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
