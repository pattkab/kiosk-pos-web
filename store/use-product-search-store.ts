import { PosProduct } from "@/types/pos";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProductSearchState {
  search: string;
  debouncedSearch: string;
  activeCategoryId: string | null;
  selectedIndex: number;
  recentProducts: PosProduct[];
  setSearch: (search: string) => void;
  setDebouncedSearch: (search: string) => void;
  setActiveCategoryId: (categoryId: string | null) => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (direction: 1 | -1, productCount: number) => void;
  rememberProduct: (product: PosProduct) => void;
  resetSearch: () => void;
}

export const useProductSearchStore = create<ProductSearchState>()(
  persist(
    (set, get) => ({
      search: "",
      debouncedSearch: "",
      activeCategoryId: null,
      selectedIndex: 0,
      recentProducts: [],
      setSearch: (search) => set({ search, selectedIndex: 0 }),
      setDebouncedSearch: (debouncedSearch) => set({ debouncedSearch }),
      setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId, selectedIndex: 0 }),
      setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
      moveSelection: (direction, productCount) => {
        if (productCount === 0) return;
        const next = (get().selectedIndex + direction + productCount) % productCount;
        set({ selectedIndex: next });
      },
      rememberProduct: (product) =>
        set((state) => ({
          recentProducts: [
            product,
            ...state.recentProducts.filter((entry) => entry.id !== product.id),
          ].slice(0, 12),
        })),
      resetSearch: () => set({ search: "", debouncedSearch: "", activeCategoryId: null, selectedIndex: 0 }),
    }),
    {
      name: "pos-product-search-storage",
      partialize: (state) => ({ recentProducts: state.recentProducts }),
    }
  )
);
