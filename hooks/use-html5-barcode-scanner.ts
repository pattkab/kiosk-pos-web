"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { normalizeScannedCode } from "@/lib/barcode";
import {
  BARCODE_SCANNER_CAMERA_CONFIG,
  BARCODE_SCANNER_ENGINE_CONFIG,
  BARCODE_SCANNER_VIEW_CONFIG,
} from "@/lib/barcode/scanner-config";
import {
  ensureCameraPermission,
  formatScannerStartError,
} from "@/lib/native/camera-permissions";

type UseHtml5BarcodeScannerOptions = {
  enabled: boolean;
  elementId: string;
  onScan: (code: string) => void | Promise<void>;
  debounceMs?: number;
};

export function useHtml5BarcodeScanner({
  enabled,
  elementId,
  onScan,
  debounceMs = 800,
}: UseHtml5BarcodeScannerOptions) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanAtRef = useRef(0);
  const onScanRef = useRef(onScan);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) {
      setIsScanning(false);
      return;
    }

    let mounted = true;
    setScanError(null);
    setIsScanning(false);

    void (async () => {
      const permission = await ensureCameraPermission();
      if (!mounted) return;

      if (!permission.granted) {
        setScanError(permission.message ?? "Camera permission is required to scan barcodes.");
        setIsScanning(false);
        return;
      }

      const scanner = new Html5Qrcode(elementId, BARCODE_SCANNER_ENGINE_CONFIG);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          BARCODE_SCANNER_CAMERA_CONFIG,
          BARCODE_SCANNER_VIEW_CONFIG,
          async (decodedText) => {
            const now = Date.now();
            if (now - lastScanAtRef.current < debounceMs) return;
            lastScanAtRef.current = now;

            const code = normalizeScannedCode(decodedText);
            await onScanRef.current(code);
          },
          () => undefined,
        );

        if (mounted) {
          setIsScanning(true);
        }
      } catch (error) {
        if (mounted) {
          setScanError(formatScannerStartError(error));
          setIsScanning(false);
        }
      }
    })();

    return () => {
      mounted = false;
      setIsScanning(false);

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
  }, [debounceMs, elementId, enabled]);

  return { isScanning, scanError, setScanError };
}
