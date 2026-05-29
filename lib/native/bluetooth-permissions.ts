import { isCapacitorNative, getCapacitorPlatform } from "@/lib/utils/capacitor";

/**
 * Bluetooth permissions are declared in AndroidManifest.
 * The thermal printer plugin prompts on scan/connect when needed.
 */
export async function ensureBluetoothPermissions(): Promise<boolean> {
  if (!isCapacitorNative() || getCapacitorPlatform() !== "android") {
    return true;
  }
  return true;
}
