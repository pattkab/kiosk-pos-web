const DEVICE_ID_KEY = "kiosk-pos-device-id";

export function getDeviceId() {
  if (typeof window === "undefined") return "server";
  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `device-${Date.now()}`;
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
