import type { CompletedReceipt } from "@/types/pos";
import { formatThermalReceipt } from "@/lib/native/thermal-receipt";
import {
  getSavedPrinter,
  type SavedPrinter,
} from "@/lib/native/printer-storage";
import { isCapacitorNative } from "@/lib/utils/capacitor";

export type DiscoveredPrinter = SavedPrinter;

async function loadPrinterPlugin() {
  const { CapacitorThermalPrinter } = await import("capacitor-thermal-printer");
  return CapacitorThermalPrinter;
}

export async function isPrinterConnected(): Promise<boolean> {
  if (!isCapacitorNative()) return false;
  try {
    const CapacitorThermalPrinter = await loadPrinterPlugin();
    return CapacitorThermalPrinter.isConnected();
  } catch {
    return false;
  }
}

export async function connectToPrinter(
  printer: SavedPrinter,
): Promise<boolean> {
  const CapacitorThermalPrinter = await loadPrinterPlugin();
  const device = await CapacitorThermalPrinter.connect({
    address: printer.address,
  });
  return device !== null;
}

export async function ensurePrinterConnected(): Promise<boolean> {
  if (!isCapacitorNative()) return false;
  const saved = getSavedPrinter();
  if (!saved) return false;

  if (await isPrinterConnected()) return true;
  return connectToPrinter(saved);
}

/** Scan for nearby Bluetooth ESC/POS printers (Android). */
export async function scanForPrinters(
  timeoutMs = 8000,
): Promise<DiscoveredPrinter[]> {
  const CapacitorThermalPrinter = await loadPrinterPlugin();
  const found = new Map<string, DiscoveredPrinter>();

  const listener = await CapacitorThermalPrinter.addListener(
    "discoverDevices",
    (data) => {
      for (const device of data.devices) {
        if (device.address) {
          found.set(device.address, {
            address: device.address,
            name: device.name || device.address,
          });
        }
      }
    },
  );

  try {
    await CapacitorThermalPrinter.startScan();
    await new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
    await CapacitorThermalPrinter.stopScan();
  } finally {
    listener.remove();
  }

  return [...found.values()];
}

export async function printReceiptToBluetooth(
  receipt: CompletedReceipt,
): Promise<boolean> {
  if (!isCapacitorNative()) return false;

  const connected = await ensurePrinterConnected();
  if (!connected) return false;

  const CapacitorThermalPrinter = await loadPrinterPlugin();
  const text = `${formatThermalReceipt(receipt)}\n`;

  await CapacitorThermalPrinter.begin()
    .align("left")
    .font("A")
    .text(text)
    .feedCutPaper()
    .write();

  return true;
}

export async function disconnectPrinter() {
  if (!isCapacitorNative()) return;
  const CapacitorThermalPrinter = await loadPrinterPlugin();
  await CapacitorThermalPrinter.disconnect();
}
