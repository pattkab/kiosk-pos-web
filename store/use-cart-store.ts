import { CartItem, CartTotals, PosProduct, AppliedDiscount } from "@/types/pos";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const finiteMoney = (value: number) => (Number.isFinite(value) ? value : 0);

function discountFor(base: number, discount: AppliedDiscount | null) {
  if (!discount) return 0;
  const value = Math.max(0, finiteMoney(discount.value));
  if (discount.type === "percentage") return roundMoney(base * Math.min(value, 100) / 100);
  return roundMoney(Math.min(value, base));
}

function calculateTotals(items: CartItem[], cartDiscount: AppliedDiscount | null): CartTotals {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0));
  const itemDiscountTotal = roundMoney(
    items.reduce((sum, item) => sum + discountFor(item.unit_price * item.quantity, item.discount), 0)
  );
  const cartDiscountTotal = discountFor(Math.max(0, subtotal - itemDiscountTotal), cartDiscount);
  const discountTotal = roundMoney(itemDiscountTotal + cartDiscountTotal);
  const taxableSubtotal = Math.max(0, subtotal - discountTotal);
  const taxAmount = roundMoney(
    items.reduce((sum, item) => {
      const lineSubtotal = item.unit_price * item.quantity;
      const lineDiscount = discountFor(lineSubtotal, item.discount);
      const cartShare = subtotal > 0 ? cartDiscountTotal * (lineSubtotal / subtotal) : 0;
      const taxableLine = Math.max(0, lineSubtotal - lineDiscount - cartShare);

      if (item.tax_mode === "inclusive") {
        return sum + taxableLine - taxableLine / (1 + item.tax_rate);
      }

      return sum + taxableLine * item.tax_rate;
    }, 0)
  );
  const hasInclusiveTax = items.some((item) => item.tax_mode === "inclusive");
  const total = roundMoney(taxableSubtotal + (hasInclusiveTax ? 0 : taxAmount));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, discountTotal, taxableSubtotal, taxAmount, total, itemCount };
}

interface CartState {
  items: CartItem[];
  cartDiscount: AppliedDiscount | null;
  defaultTaxRate: number;
  taxMode: "exclusive" | "inclusive";
  lastAddedProductId: string | null;
  addItem: (product: PosProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  setItemDiscount: (productId: string, discount: AppliedDiscount | null) => void;
  setCartDiscount: (discount: AppliedDiscount | null) => void;
  setItemNote: (productId: string, note: string) => void;
  setTaxRate: (rate: number) => void;
  setTaxMode: (mode: "exclusive" | "inclusive") => void;
  clearCart: () => void;
  validateCart: () => string[];
  getTotals: () => CartTotals;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
  getDiscountTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartDiscount: null,
      defaultTaxRate: 0.08,
      taxMode: "exclusive",
      lastAddedProductId: null,

      addItem: (product) => {
        const stock = Number(product.stock_quantity ?? 0);
        if (stock <= 0) return;
        const items = get().items;
        const existingItem = items.find((item) => item.product_id === product.id);

        if (existingItem) {
          const nextQuantity = Math.min(existingItem.quantity + 1, stock);
          set({
            items: items.map((item) =>
              item.product_id === product.id ? { ...item, quantity: nextQuantity } : item
            ),
            lastAddedProductId: product.id,
          });
          return;
        }

        set({
          items: [
            ...items,
            {
              product_id: product.id,
              name: product.name,
              quantity: 1,
              unit_price: Number(product.selling_price ?? 0),
              unit_cost: Number(product.cost_price ?? 0),
              stock_quantity: stock,
              tax_rate: get().defaultTaxRate,
              tax_mode: get().taxMode,
              discount: null,
              note: "",
              sku: product.sku,
              barcode: product.barcode,
              image_url: product.image_url,
            },
          ],
          lastAddedProductId: product.id,
        });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product_id === productId
                ? { ...item, quantity: Math.min(Math.max(0, quantity), item.stock_quantity) }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),

      incrementItem: (productId) => {
        const item = get().items.find((entry) => entry.product_id === productId);
        if (item) get().updateQuantity(productId, item.quantity + 1);
      },

      decrementItem: (productId) => {
        const item = get().items.find((entry) => entry.product_id === productId);
        if (item) get().updateQuantity(productId, item.quantity - 1);
      },

      setItemDiscount: (productId, discount) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId ? { ...item, discount } : item
          ),
        })),

      setCartDiscount: (cartDiscount) => set({ cartDiscount }),

      setItemNote: (productId, note) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId ? { ...item, note } : item
          ),
        })),

      setTaxRate: (defaultTaxRate) =>
        set((state) => ({
          defaultTaxRate,
          items: state.items.map((item) => ({ ...item, tax_rate: defaultTaxRate })),
        })),
      setTaxMode: (taxMode) =>
        set((state) => ({
          taxMode,
          items: state.items.map((item) => ({ ...item, tax_mode: taxMode })),
        })),
      clearCart: () => set({ items: [], cartDiscount: null, lastAddedProductId: null }),

      validateCart: () => {
        const errors: string[] = [];
        for (const item of get().items) {
          if (item.quantity > item.stock_quantity) {
            errors.push(`${item.name} only has ${item.stock_quantity} in stock.`);
          }
          if (item.quantity <= 0) errors.push(`${item.name} has an invalid quantity.`);
        }
        return errors;
      },

      getTotals: () => calculateTotals(get().items, get().cartDiscount),
      getSubtotal: () => get().getTotals().subtotal,
      getTaxAmount: () => get().getTotals().taxAmount,
      getTotal: () => get().getTotals().total,
      getDiscountTotal: () => get().getTotals().discountTotal,
    }),
    {
      name: "pos-cart-storage",
      version: 2,
      storage: createJSONStorage(() => window.localStorage),
    }
  )
);
