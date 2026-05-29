"use client";

import { useMemo } from "react";
import {
  Camera,
  CheckCircle2,
  Loader2,
  ScanBarcode,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHtml5BarcodeScanner } from "@/hooks/use-html5-barcode-scanner";
import { useInventoryStore } from "@/store/use-inventory-store";
import { toast } from "sonner";

export function BarcodeScanner() {
  const scannerId = useMemo(() => "inventory-barcode-scanner", []);
  const {
    scannerOpen,
    scannerTarget,
    setScannerOpen,
    setSearchQuery,
    setScannedBarcode,
  } = useInventoryStore();

  const { isScanning, scanError } = useHtml5BarcodeScanner({
    enabled: scannerOpen,
    elementId: scannerId,
    debounceMs: 700,
    onScan: (code) => {
      if (scannerTarget === "product-form-barcode") {
        setScannedBarcode(code);
      } else {
        setSearchQuery(code);
        toast.success("Barcode found");
      }
      setScannerOpen(false);
    },
  });

  return (
    <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
      <DialogContent className="max-w-[520px] overflow-hidden p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ScanBarcode className="h-5 w-5" />
            Barcode scanner
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="relative overflow-hidden rounded-lg border bg-black">
            <div id={scannerId} className="min-h-[320px] w-full" />
            <div className="pointer-events-none absolute inset-x-12 top-1/2 h-px bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Badge
              variant={isScanning ? "default" : "secondary"}
              className="h-8 gap-2 px-3"
            >
              {isScanning ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isScanning ? "Scanning" : "Starting camera"}
            </Badge>
          </div>

          {scanError ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          ) : null}

          <Button
            className="h-12 w-full gap-2"
            variant="secondary"
            onClick={() => setScannerOpen(false)}
          >
            <Camera className="h-4 w-4" />
            Close scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
