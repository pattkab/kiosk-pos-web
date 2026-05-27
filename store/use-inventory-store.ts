import { create } from "zustand";

interface InventoryState {
  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (id: string | null) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
  stockFilter: 'all' | 'low' | 'out';
  setStockFilter: (filter: 'all' | 'low' | 'out') => void;

  // Selected Products (Bulk Actions)
  selectedProductIds: string[];
  setSelectedProducts: (ids: string[]) => void;
  toggleProductSelection: (id: string) => void;

  // Modals
  productModalOpen: boolean;
  editingProductId: string | null;
  openProductModal: (id?: string | null) => void;
  closeProductModal: () => void;

  adjustmentModalOpen: boolean;
  adjustingProductId: string | null;
  openAdjustmentModal: (id: string) => void;
  closeAdjustmentModal: () => void;

  categoryModalOpen: boolean;
  openCategoryModal: () => void;
  closeCategoryModal: () => void;

  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  categoryFilter: null,
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  statusFilter: 'all',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  stockFilter: 'all',
  setStockFilter: (stockFilter) => set({ stockFilter }),

  selectedProductIds: [],
  setSelectedProducts: (selectedProductIds) => set({ selectedProductIds }),
  toggleProductSelection: (id) => set((state) => ({
    selectedProductIds: state.selectedProductIds.includes(id)
      ? state.selectedProductIds.filter(pid => pid !== id)
      : [...state.selectedProductIds, id]
  })),

  productModalOpen: false,
  editingProductId: null,
  openProductModal: (id = null) => set({ productModalOpen: true, editingProductId: id }),
  closeProductModal: () => set({ productModalOpen: false, editingProductId: null }),

  adjustmentModalOpen: false,
  adjustingProductId: null,
  openAdjustmentModal: (id) => set({ adjustmentModalOpen: true, adjustingProductId: id }),
  closeAdjustmentModal: () => set({ adjustmentModalOpen: false, adjustingProductId: null }),

  categoryModalOpen: false,
  openCategoryModal: () => set({ categoryModalOpen: true }),
  closeCategoryModal: () => set({ categoryModalOpen: false }),

  scannerOpen: false,
  setScannerOpen: (scannerOpen) => set({ scannerOpen }),
}));
