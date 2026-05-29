"use client";

import { useEffect, useState } from "react";
import { Sun, Bell, Smartphone, ScanBarcode, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNativeShell } from "@/hooks/use-native-shell";
import {
  isKeepAwakeEnabled,
  KEEP_AWAKE_STORAGE_KEY,
} from "@/hooks/use-pos-kiosk-mode";
import {
  ensureNativeNotificationPermission,
} from "@/lib/native/native-notifications";
import { ensureCameraPermission } from "@/lib/native/camera-permissions";
import { PrinterSettingsCard } from "@/features/settings/components/printer-settings-card";
import { requestAppReviewCheck, getAppReviewState, recordNativeAppSessionDay } from "@/lib/native/app-review";
import { toast } from "sonner";

type AppInfo = {
  name: string;
  version: string;
  build: string;
};

export function DeviceSettings() {
  const { isNative, platform } = useNativeShell();
  const [keepAwake, setKeepAwake] = useState(true);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  useEffect(() => {
    setKeepAwake(isKeepAwakeEnabled());
  }, []);

  useEffect(() => {
    if (!isNative) return;

    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        setAppInfo({
          name: info.name,
          version: info.version,
          build: info.build,
        });
      } catch {
        setAppInfo({ name: "Kiosk POS", version: "—", build: "—" });
      }

      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const status = await LocalNotifications.checkPermissions();
      setNotificationsEnabled(status.display === "granted");

      const { Camera } = await import("@capacitor/camera");
      const cameraStatus = await Camera.checkPermissions();
      setCameraEnabled(cameraStatus.camera === "granted");
    })();
  }, [isNative]);

  if (!isNative) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device &amp; app
          </CardTitle>
          <CardDescription>
            These controls are available in the native iOS or Android app (Capacitor shell), not in the browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Device &amp; app</h2>
        <p className="text-sm text-muted-foreground">
          Native app settings for shop-floor phones and tablets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">App info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-medium capitalize">{platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">
              {appInfo ? `${appInfo.version} (${appInfo.build})` : "Loading…"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Package</span>
            <span className="font-mono text-xs">shop.kioskpos.app</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4" />
            POS kiosk mode
          </CardTitle>
          <CardDescription>
            Keep the screen awake while on POS so the register does not lock during a shift.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="keep-awake">Keep screen on at POS</Label>
              <p className="text-xs text-muted-foreground">
                Applies on /pos routes only.
              </p>
            </div>
            <input
              id="keep-awake"
              type="checkbox"
              className="h-5 w-5 accent-primary"
              checked={keepAwake}
              onChange={(event) => {
                const enabled = event.target.checked;
                setKeepAwake(enabled);
                localStorage.setItem(
                  KEEP_AWAKE_STORAGE_KEY,
                  enabled ? "true" : "false",
                );
                toast.success(
                  enabled
                    ? "Screen will stay awake on POS."
                    : "Screen may sleep on POS.",
                );
              }}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Sync alerts
          </CardTitle>
          <CardDescription>
            Notify when offline sales fail to sync or need conflict resolution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {notificationsEnabled ? "Enabled" : "Not enabled"}
            </span>
          </p>
          {!notificationsEnabled ? (
            <Button
              variant="outline"
              onClick={() => {
                void ensureNativeNotificationPermission().then((granted) => {
                  setNotificationsEnabled(granted);
                  toast.success(
                    granted
                      ? "Sync notifications enabled."
                      : "Permission denied in system settings.",
                  );
                });
              }}
            >
              Enable notifications
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanBarcode className="h-4 w-4" />
            Barcode scanner
          </CardTitle>
          <CardDescription>
            Camera access is required to scan product barcodes at POS and in inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">
              {cameraEnabled ? "Enabled" : "Not enabled"}
            </span>
          </p>
          {!cameraEnabled ? (
            <Button
              variant="outline"
              onClick={() => {
                void ensureCameraPermission().then((result) => {
                  setCameraEnabled(result.granted);
                  toast.success(
                    result.granted
                      ? "Camera enabled for barcode scanning."
                      : result.message ?? "Permission denied in system settings.",
                  );
                });
              }}
            >
              Enable camera
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-orange-500" />
            Rate Kiosk POS
          </CardTitle>
          <CardDescription>
            Leave a review on the {platform === "ios" ? "App Store" : "Google Play Store"} to help
            other shop owners find the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-white hover:from-orange-400 hover:to-amber-400 sm:w-auto"
            onClick={() => {
              requestAppReviewCheck("manual");
              toast.message("Opening rating prompt…");
            }}
          >
            Rate this app
          </Button>
        </CardContent>
      </Card>

      <PrinterSettingsCard />
    </div>
  );
}
