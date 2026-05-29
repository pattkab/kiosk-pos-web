import type { CompletedReceipt } from "@/types/pos";
import { isCapacitorNative } from "@/lib/utils/capacitor";
import { formatThermalReceipt } from "@/lib/native/thermal-receipt";

/** Print or share a receipt. Native: share sheet with thermal text. Web: browser print dialog. */
export async function printOrShareReceipt(receipt: CompletedReceipt) {
  if (isCapacitorNative()) {
    const text = formatThermalReceipt(receipt);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `Receipt ${receipt.receiptNumber}`,
          text,
        });
        return;
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
    }

    await navigator.clipboard.writeText(text);
    return;
  }

  window.print();
}
