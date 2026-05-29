import { isCapacitorNative } from "@/lib/utils/capacitor";

export type CameraPermissionResult = {
  granted: boolean;
  message?: string;
};

function cameraDeniedMessage(): string {
  if (isCapacitorNative()) {
    return "Camera access was denied. Enable Camera for Kiosk POS in system Settings, then try again.";
  }

  return "Camera access was denied. Allow camera for this site in your browser settings, then try again.";
}

function cameraUnavailableMessage(): string {
  if (typeof window === "undefined") {
    return "Camera is not available in this environment.";
  }

  if (!window.isSecureContext) {
    return "Camera requires a secure connection (HTTPS). Open the app over HTTPS and try again.";
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "Camera is not supported in this browser.";
  }

  return "Camera is not available on this device.";
}

export async function ensureCameraPermission(): Promise<CameraPermissionResult> {
  if (typeof navigator === "undefined") {
    return { granted: false, message: cameraUnavailableMessage() };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { granted: false, message: cameraUnavailableMessage() };
  }

  if (isCapacitorNative()) {
    try {
      const { Camera } = await import("@capacitor/camera");
      const status = await Camera.checkPermissions();
      if (status.camera === "granted") {
        return { granted: true };
      }

      const requested = await Camera.requestPermissions({ permissions: ["camera"] });
      if (requested.camera === "granted") {
        return { granted: true };
      }

      return { granted: false, message: cameraDeniedMessage() };
    } catch {
      return { granted: false, message: cameraUnavailableMessage() };
    }
  }

  try {
    const permissionStatus = await navigator.permissions?.query({
      name: "camera" as PermissionName,
    });
    if (permissionStatus?.state === "denied") {
      return { granted: false, message: cameraDeniedMessage() };
    }
  } catch {
    // Permissions API is not supported everywhere; getUserMedia will prompt on start.
  }

  return { granted: true };
}

export function formatScannerStartError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Camera scanner could not start.";
  }

  const message = error.message.toLowerCase();
  if (
    message.includes("permission") ||
    message.includes("notallowed") ||
    message.includes("denied")
  ) {
    return cameraDeniedMessage();
  }

  if (message.includes("notfound") || message.includes("not found") || message.includes("no camera")) {
    return "No camera was found on this device.";
  }

  return error.message || "Camera scanner could not start.";
}
