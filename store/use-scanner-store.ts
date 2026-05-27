import { create } from "zustand";

interface ScannerState {
  isScannerOpen: boolean;
  isScanning: boolean;
  lastScan: string | null;
  scanError: string | null;
  openScanner: () => void;
  closeScanner: () => void;
  setScanning: (isScanning: boolean) => void;
  setLastScan: (lastScan: string | null) => void;
  setScanError: (scanError: string | null) => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  isScannerOpen: false,
  isScanning: false,
  lastScan: null,
  scanError: null,
  openScanner: () => set({ isScannerOpen: true, scanError: null }),
  closeScanner: () => set({ isScannerOpen: false, isScanning: false }),
  setScanning: (isScanning) => set({ isScanning }),
  setLastScan: (lastScan) => set({ lastScan }),
  setScanError: (scanError) => set({ scanError }),
}));
