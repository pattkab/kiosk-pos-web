"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { CheckCircle2, Printer } from "lucide-react";
import { printOrShareReceipt } from "@/lib/native/receipt-print";
import { isCapacitorNative } from "@/lib/utils/capacitor";
import { toast } from "sonner";
import { ReceiptPreview } from "@/features/receipts/components/receipt-preview";

export function GlobalReceiptModal() {
  const { receipt, isReceiptOpen, receiptMode, closeReceipt } = useCheckoutStore();

  if (!receipt) return null;

  const isReprint = receiptMode === "reprint";

  return (
    <Dialog open={isReceiptOpen} onOpenChange={(open) => !open && closeReceipt()}>
      <DialogContent className="max-w-[440px] p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            {isReprint ? (
              <>
                <Printer className="h-5 w-5" />
                {receipt.invoiceNumber ? "Invoice & receipt" : "Receipt"}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Sale complete
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto p-5">
          <ReceiptPreview receipt={receipt} />
        </div>

        <div className="flex gap-3 border-t p-5">
          <Button
            className="h-12 flex-1 gap-2"
            onClick={() => {
              void printOrShareReceipt(receipt)
                .then((result) => {
                  if (result.method === "bluetooth") {
                    toast.success("Receipt sent to printer.");
                  } else if (result.method === "share") {
                    toast.success("Choose a printer app from the share menu.");
                  } else if (result.method === "clipboard") {
                    toast.success("Receipt copied to clipboard.");
                  }
                })
                .catch((error) => {
                  if ((error as Error)?.name !== "AbortError") {
                    toast.error("Could not print receipt.");
                  }
                });
            }}
          >
            <Printer className="h-4 w-4" />
            {isCapacitorNative() ? "Print receipt" : "Print"}
          </Button>
          <Button
            className="h-12 flex-1"
            variant="secondary"
            onClick={closeReceipt}
          >
            {isReprint ? "Close" : "New sale"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
