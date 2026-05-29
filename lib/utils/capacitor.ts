import { Capacitor } from "@capacitor/core";

export const NATIVE_USER_AGENT_MARKER = "KioskPOS-Native/";

type CapacitorWindow = Window & {
  Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
};

/** True when running inside a Capacitor native shell (Android / iOS). */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    /* bridge not ready */
  }

  const bridge = (window as CapacitorWindow).Capacitor;
  if (bridge?.isNativePlatform?.()) return true;

  if (navigator.userAgent.includes(NATIVE_USER_AGENT_MARKER)) return true;

  const root = document.documentElement;
  if (root.classList.contains("native-app")) return true;
  if (root.dataset.capacitorPlatform === "android" || root.dataset.capacitorPlatform === "ios") {
    return true;
  }

  return false;
}

export function getCapacitorPlatform(): "android" | "ios" | "web" {
  if (!isCapacitorNative()) return "web";

  try {
    const platform = Capacitor.getPlatform();
    if (platform === "android" || platform === "ios") return platform;
  } catch {
    /* fall through */
  }

  const fromDataset = document.documentElement.dataset.capacitorPlatform;
  if (fromDataset === "android" || fromDataset === "ios") return fromDataset;

  if (/android/i.test(navigator.userAgent)) return "android";
  return "web";
}
