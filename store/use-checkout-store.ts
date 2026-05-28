import { CheckoutPayment, CompletedReceipt } from "@/types/pos";
import { create } from "zustand";

interface CheckoutState {
  isPaymentOpen: boolean;
  isReceiptOpen: boolean;
  isProcessing: boolean;
  payments: CheckoutPayment[];
  receipt: CompletedReceipt | null;
  selectedCustomerId: string | null;
  selectedCustomerName: string | null;
  openPayment: () => void;
  closePayment: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setPayments: (payments: CheckoutPayment[]) => void;
  setReceipt: (receipt: CompletedReceipt | null) => void;
  setSelectedCustomer: (id: string | null, name?: string | null) => void;
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
  selectedCustomerId: null,
  selectedCustomerName: null,
  openPayment: () => set({ isPaymentOpen: true }),
  closePayment: () => set({ isPaymentOpen: false }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setPayments: (payments) => set({ payments }),
  setReceipt: (receipt) => set({ receipt, isReceiptOpen: Boolean(receipt) }),
  setSelectedCustomer: (selectedCustomerId, selectedCustomerName = null) =>
    set({ selectedCustomerId, selectedCustomerName }),
  openReceipt: () => set({ isReceiptOpen: true }),
  closeReceipt: () => set({ isReceiptOpen: false }),
  resetCheckout: () =>
    set({
      isPaymentOpen: false,
      isReceiptOpen: false,
      isProcessing: false,
      payments: [],
      receipt: null,
      selectedCustomerId: null,
      selectedCustomerName: null,
    }),
}));
