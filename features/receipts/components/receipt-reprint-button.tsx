"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Printer, ReceiptText } from "lucide-react";
import { useSaleReceiptReprint } from "@/hooks/use-sale-receipt";

export function ReceiptReprintButton({
  saleId,
  label = "Print",
  variant = "outline",
  size = "sm",
}: {
  saleId: string;
  label?: string;
  variant?: "outline" | "ghost" | "default" | "secondary";
  size?: "sm" | "default" | "icon";
}) {
  const reprint = useSaleReceiptReprint();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={reprint.isPending}
      onClick={() => void reprint.mutateAsync(saleId)}
      className="gap-2"
    >
      {reprint.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : size === "icon" ? (
        <Printer className="h-4 w-4" />
      ) : (
        <>
          <ReceiptText className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
