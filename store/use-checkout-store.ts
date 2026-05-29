import { CheckoutPayment, CompletedReceipt } from "@/types/pos";
import { create } from "zustand";

interface CheckoutState {
  isPaymentOpen: boolean;
  isReceiptOpen: boolean;
  isProcessing: boolean;
  payments: CheckoutPayment[];
  receipt: CompletedReceipt | null;
  receiptMode: "checkout" | "reprint";
  selectedCustomerId: string | null;
  selectedCustomerName: string | null;
  selectedCustomerPoints: number;
  loyaltyPointsToRedeem: number;
  openPayment: () => void;
  closePayment: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setPayments: (payments: CheckoutPayment[]) => void;
  setReceipt: (
    receipt: CompletedReceipt | null,
    mode?: "checkout" | "reprint",
  ) => void;
  setSelectedCustomer: (
    id: string | null,
    name?: string | null,
    points?: number,
  ) => void;
  setLoyaltyPointsToRedeem: (points: number) => void;
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
  receiptMode: "checkout",
  selectedCustomerId: null,
  selectedCustomerName: null,
  selectedCustomerPoints: 0,
  loyaltyPointsToRedeem: 0,
  openPayment: () => set({ isPaymentOpen: true }),
  closePayment: () => set({ isPaymentOpen: false }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setPayments: (payments) => set({ payments }),
  setReceipt: (receipt, receiptMode = "checkout") =>
    set({
      receipt,
      receiptMode,
      isReceiptOpen: Boolean(receipt),
    }),
  setSelectedCustomer: (
    selectedCustomerId,
    selectedCustomerName = null,
    selectedCustomerPoints = 0,
  ) =>
    set({
      selectedCustomerId,
      selectedCustomerName,
      selectedCustomerPoints,
      loyaltyPointsToRedeem: 0,
    }),
  setLoyaltyPointsToRedeem: (loyaltyPointsToRedeem) =>
    set({ loyaltyPointsToRedeem: Math.max(0, loyaltyPointsToRedeem) }),
  openReceipt: () => set({ isReceiptOpen: true }),
  closeReceipt: () => set({ isReceiptOpen: false }),
  resetCheckout: () =>
    set({
      isPaymentOpen: false,
      isReceiptOpen: false,
      isProcessing: false,
      payments: [],
      receipt: null,
      receiptMode: "checkout",
      selectedCustomerId: null,
      selectedCustomerName: null,
      selectedCustomerPoints: 0,
      loyaltyPointsToRedeem: 0,
    }),
}));
