"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBarcodeLookup } from "@/hooks/use-pos";
import { useLoyaltyCustomerLookup } from "@/hooks/use-customers";
import { useOrganizationSettings } from "@/hooks/use-organization";
import { useHtml5BarcodeScanner } from "@/hooks/use-html5-barcode-scanner";
import { useCartStore } from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { useProductSearchStore } from "@/store/use-product-search-store";
import { useScannerStore } from "@/store/use-scanner-store";
import { canUseFeature } from "@/lib/billing/plans";
import { normalizeScannedCode } from "@/lib/barcode";
import { isLoyaltyCardCode } from "@/lib/loyalty/card";
import { customerToCheckoutSelection } from "@/lib/loyalty/attach-customer";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import {
  Camera,
  CheckCircle2,
  Loader2,
  ScanBarcode,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export function BarcodeScanner() {
  const scannerId = useMemo(() => "pos-barcode-scanner", []);
  const {
    isScannerOpen,
    lastScan,
    scanError,
    closeScanner,
    setLastScan,
    setScanError,
  } = useScannerStore();
  const { addItem } = useCartStore();
  const { setSelectedCustomer } = useCheckoutStore();
  const { rememberProduct } = useProductSearchStore();
  const organizationSettings = useOrganizationSettings();
  const barcodeLookup = useBarcodeLookup();
  const loyaltyCustomerLookup = useLoyaltyCustomerLookup();
  const canUseCustomers = canUseFeature(
    organizationSettings.data,
    "customerAccounts",
  );

  const { isScanning, scanError: scannerError } = useHtml5BarcodeScanner({
    enabled: isScannerOpen,
    elementId: scannerId,
    debounceMs: 900,
    onScan: async (rawCode) => {
      const code = normalizeScannedCode(rawCode);
      setLastScan(code);
      setScanError(null);

      if (canUseCustomers && isLoyaltyCardCode(code)) {
        try {
          const customer = await loyaltyCustomerLookup.mutateAsync(code);
          const selection = customerToCheckoutSelection(customer);
          setSelectedCustomer(
            selection.id,
            selection.name,
            selection.points,
          );
          toast.success(`${selection.name} attached for loyalty`);
          return;
        } catch (error) {
          setScanError(
            getUserErrorMessage(
              error,
              "Loyalty card not found. Check the code and try again.",
            ),
          );
          return;
        }
      }

      try {
        const product = await barcodeLookup.mutateAsync(code);
        addItem(product);
        rememberProduct(product);
        toast.success(`${product.name} added`);
      } catch (error) {
        setScanError(
          getUserErrorMessage(error, "Unable to read barcode."),
        );
      }
    },
  });

  const displayError = scanError ?? scannerError;

  return (
    <Dialog
      open={isScannerOpen}
      onOpenChange={(open) => !open && closeScanner()}
    >
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
            {lastScan && (
              <span className="truncate text-sm text-muted-foreground">
                Last scan: {lastScan}
              </span>
            )}
          </div>

          {displayError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <Button
            className="h-12 w-full gap-2"
            variant="secondary"
            onClick={closeScanner}
          >
            <Camera className="h-4 w-4" />
            Done scanning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
