import { isCapacitorNative } from "@/lib/utils/capacitor";

const SYNC_FAILURE_NOTIFICATION_ID = 9001;

let permissionRequested = false;

export async function ensureNativeNotificationPermission(): Promise<boolean> {
  if (!isCapacitorNative()) return false;

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    if (!permissionRequested) {
      await LocalNotifications.requestPermissions();
      permissionRequested = true;
    }
    const status = await LocalNotifications.checkPermissions();
    return status.display === "granted";
  } catch {
    return false;
  }
}

export async function notifyNativeSyncFailure(message: string) {
  if (!isCapacitorNative()) return;

  const granted = await ensureNativeNotificationPermission();
  if (!granted) return;

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: SYNC_FAILURE_NOTIFICATION_ID,
          title: "Kiosk POS sync needs attention",
          body: message,
          schedule: { at: new Date(Date.now() + 500) },
          extra: { route: "/pos/queue" },
        },
      ],
    });
  } catch (error) {
    console.warn("[NativeNotifications] Failed to schedule alert:", error);
  }
}
