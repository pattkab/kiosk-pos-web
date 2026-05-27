"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useInventoryStore } from "@/store/use-inventory-store";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

export function BarcodeScanner() {
  const { scannerOpen, setScannerOpen, setSearchQuery } = useInventoryStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scannerOpen) {
      scanner = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 150 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setSearchQuery(decodedText);
          setScannerOpen(false);
          if (scanner) scanner.clear();
        },
        (err) => {
          // Silent error for scanning frames
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [scannerOpen, setScannerOpen, setSearchQuery]);

  return (
    <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" /> Barcode Scanner
          </DialogTitle>
        </DialogHeader>
        <div id="barcode-reader" className="overflow-hidden rounded-lg border bg-black" />
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Center the barcode within the box to scan.
        </div>
        <Button variant="outline" className="w-full" onClick={() => setScannerOpen(false)}>
          <X className="mr-2 h-4 w-4" /> Close Scanner
        </Button>
      </DialogContent>
    </Dialog>
  );
}
