import { CheckoutPayment, CompletedReceipt } from "@/types/pos";
import { create } from "zustand";

interface CheckoutState {
  isPaymentOpen: boolean;
  isReceiptOpen: boolean;
  isProcessing: boolean;
  payments: CheckoutPayment[];
  receipt: CompletedReceipt | null;
  openPayment: () => void;
  closePayment: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setPayments: (payments: CheckoutPayment[]) => void;
  setReceipt: (receipt: CompletedReceipt | null) => void;
  openReceipt: () => void;
  closeReceipt: () => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  isPaymentOpen: false,
  isReceiptOpen: false,
  isProcessing: false,
  payments: [],
  receipt: null,
  openPayment: () => set({ isPaymentOpen: true }),
  closePayment: () => set({ isPaymentOpen: false }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setPayments: (payments) => set({ payments }),
  setReceipt: (receipt) => set({ receipt, isReceiptOpen: Boolean(receipt) }),
  openReceipt: () => set({ isReceiptOpen: true }),
  closeReceipt: () => set({ isReceiptOpen: false }),
  resetCheckout: () =>
    set({
      isPaymentOpen: false,
      isReceiptOpen: false,
      isProcessing: false,
      payments: [],
      receipt: null,
    }),
}));
