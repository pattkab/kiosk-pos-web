"use client";

import { useMutation } from "@tanstack/react-query";
import { fetchSaleReceipt } from "@/lib/receipts/fetch-sale-receipt";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { toast } from "sonner";

export function useSaleReceiptReprint() {
  const setReceipt = useCheckoutStore((state) => state.setReceipt);

  return useMutation({
    mutationFn: async (saleId: string) => fetchSaleReceipt(saleId),
    onSuccess: (receipt) => {
      setReceipt(receipt, "reprint");
    },
    onError: (error) =>
      toast.error(
        getUserErrorMessage(error, "Could not load receipt for printing."),
      ),
  });
}
