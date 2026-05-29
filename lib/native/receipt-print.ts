import type { CompletedReceipt } from "@/types/pos";
import { isCapacitorNative } from "@/lib/utils/capacitor";
import { formatThermalReceipt } from "@/lib/native/thermal-receipt";
import { printReceiptToBluetooth } from "@/lib/native/bluetooth-printer";
import { getSavedPrinter } from "@/lib/native/printer-storage";

export type ReceiptPrintResult =
  | { method: "bluetooth" }
  | { method: "share" }
  | { method: "clipboard" }
  | { method: "browser" };

/** Print receipt: Bluetooth printer → share sheet → clipboard (native) or browser print. */
export async function printOrShareReceipt(
  receipt: CompletedReceipt,
): Promise<ReceiptPrintResult> {
  if (isCapacitorNative()) {
    if (getSavedPrinter()) {
      try {
        const printed = await printReceiptToBluetooth(receipt);
        if (printed) return { method: "bluetooth" };
      } catch (error) {
        console.warn("[ReceiptPrint] Bluetooth print failed:", error);
      }
    }

    const text = formatThermalReceipt(receipt);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `Receipt ${receipt.receiptNumber}`,
          text,
        });
        return { method: "share" };
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        throw error;
      }
    }

    await navigator.clipboard.writeText(text);
    return { method: "clipboard" };
  }

  window.print();
  return { method: "browser" };
}
