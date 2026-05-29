"use client";

import { useEffect } from "react";
import {
  getCapacitorPlatform,
  isCapacitorNative,
} from "@/lib/utils/capacitor";
import { navigateNativeDeepLink } from "@/lib/navigation/native-deeplink";

/**
 * Native shell bootstrap: status bar, splash, back button, deep links.
 */
export function useCapacitorApp() {
  useEffect(() => {
    if (!isCapacitorNative()) return;

    let cancelled = false;
    let removeBackListener: (() => void) | undefined;
    let removeUrlOpenListener: (() => void) | undefined;
    let removeNotifListener: (() => void) | undefined;

    document.documentElement.classList.add("native-app");
    document.documentElement.dataset.capacitorPlatform =
      getCapacitorPlatform();

    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const { App } = await import("@capacitor/app");
        const { SplashScreen } = await import("@capacitor/splash-screen");

        if (cancelled) return;

        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0a0c12" });

        const handleDeepLink = (url: string) => {
          if (navigateNativeDeepLink(url)) return;
          if (url.startsWith("http://") || url.startsWith("https://")) {
            window.location.href = url;
          }
        };

        const launch = await App.getLaunchUrl();
        if (launch?.url) handleDeepLink(launch.url);

        const urlHandle = await App.addListener("appUrlOpen", (event) => {
          handleDeepLink(event.url);
        });
        removeUrlOpenListener = () => urlHandle.remove();

        const backHandle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.minimizeApp();
          }
        });
        removeBackListener = () => backHandle.remove();

        try {
          const { LocalNotifications } = await import(
            "@capacitor/local-notifications"
          );
          const notifHandle = await LocalNotifications.addListener(
            "localNotificationActionPerformed",
            (event) => {
              const route = event.notification.extra?.route;
              if (typeof route === "string" && route.startsWith("/")) {
                window.location.href = `${window.location.origin}${route}`;
              }
            }
          );
          removeNotifListener = () => notifHandle.remove();
        } catch {
          /* notifications optional until plugin synced */
        }

        // Hide splash after first paint of remote app (or fallback shell)
        const hideSplash = () => void SplashScreen.hide();
        if (document.readyState === "complete") {
          hideSplash();
        } else {
          window.addEventListener("load", hideSplash, { once: true });
        }
      } catch (error) {
        console.warn("[Capacitor] Native plugins unavailable:", error);
      }
    })();

    return () => {
      cancelled = true;
      removeBackListener?.();
      removeUrlOpenListener?.();
      removeNotifListener?.();
      document.documentElement.classList.remove("native-app");
      delete document.documentElement.dataset.capacitorPlatform;
    };
  }, []);
}
