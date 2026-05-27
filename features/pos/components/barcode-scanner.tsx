"use client";

import { useEffect, useMemo, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBarcodeLookup } from "@/hooks/use-pos";
import { useCartStore } from "@/store/use-cart-store";
import { useProductSearchStore } from "@/store/use-product-search-store";
import { useScannerStore } from "@/store/use-scanner-store";
import { Camera, CheckCircle2, Loader2, ScanBarcode, XCircle } from "lucide-react";
import { toast } from "sonner";

export function BarcodeScanner() {
  const scannerId = useMemo(() => "pos-barcode-scanner", []);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanAtRef = useRef(0);
  const { isScannerOpen, isScanning, lastScan, scanError, closeScanner, setScanning, setLastScan, setScanError } =
    useScannerStore();
  const { addItem } = useCartStore();
  const { rememberProduct } = useProductSearchStore();
  const barcodeLookup = useBarcodeLookup();

  useEffect(() => {
    if (!isScannerOpen) return;

    let mounted = true;
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 280, height: 180 }, aspectRatio: 1.6 },
        async (decodedText) => {
          const now = Date.now();
          if (now - lastScanAtRef.current < 900) return;
          lastScanAtRef.current = now;
          setLastScan(decodedText);
          setScanError(null);

          try {
            const product = await barcodeLookup.mutateAsync(decodedText);
            addItem(product);
            rememberProduct(product);
            toast.success(`${product.name} added`);
          } catch (error) {
            setScanError(error instanceof Error ? error.message : "Unable to read barcode.");
          }
        },
        () => undefined
      )
      .then(() => mounted && setScanning(true))
      .catch((error) => {
        setScanError(error instanceof Error ? error.message : "Camera scanner could not start.");
        setScanning(false);
      });

    return () => {
      mounted = false;
      setScanning(false);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => undefined);
      }
      try {
        scannerRef.current?.clear();
      } catch {
        // The scanner may already be cleared after camera permission failures.
      }
      scannerRef.current = null;
    };
  }, [
    addItem,
    barcodeLookup,
    isScannerOpen,
    rememberProduct,
    scannerId,
    setLastScan,
    setScanError,
    setScanning,
  ]);

  return (
    <Dialog open={isScannerOpen} onOpenChange={(open) => !open && closeScanner()}>
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
            <Badge variant={isScanning ? "default" : "secondary"} className="h-8 gap-2 px-3">
              {isScanning ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              {isScanning ? "Scanning" : "Starting camera"}
            </Badge>
            {lastScan && <span className="truncate text-sm text-muted-foreground">Last scan: {lastScan}</span>}
          </div>

          {scanError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          <Button className="h-12 w-full gap-2" variant="secondary" onClick={closeScanner}>
            <Camera className="h-4 w-4" />
            Done scanning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
