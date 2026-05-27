import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import PosPage from "@/app/pos/page";
import { useCartStore } from "@/store/use-cart-store";
import { useSessionStore } from "@/store/use-session-store";
import { QueryProvider } from "@/providers/query-provider";
import { mockProduct } from "../mocks/data";

// Mock the useProducts hook
vi.mock("@/hooks/use-inventory", () => ({
  useProducts: () => ({ data: [mockProduct], isLoading: false }),
  useCategories: () => ({ data: [], isLoading: false }),
  useProductMutations: () => ({
    createProduct: { mutateAsync: vi.fn(), isPending: false },
    updateProduct: { mutateAsync: vi.fn(), isPending: false },
    deleteProduct: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

// Mock the usePosProducts hook
vi.mock("@/hooks/use-pos", () => ({
  usePosProducts: () => ({ data: [mockProduct], isLoading: false }),
  useBarcodeLookup: () => ({ mutateAsync: vi.fn() }),
  useRegisterSession: () => ({
    activeSession: { refetch: vi.fn() },
    openRegister: { mutate: vi.fn(), isPending: false },
    closeRegister: { mutate: vi.fn(), isPending: false },
  }),
  useCheckout: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("POS Checkout Integration", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useSessionStore.getState().setSession({
      id: "session-123",
      register_id: "reg-123",
      register_name: "Main Register",
      opened_at: new Date().toISOString(),
      opening_balance: 100,
      cashier_id: "profile-123",
      organization_id: "org-123",
    });
  });

  it("adds a product to the cart when clicked", async () => {
    render(
      <QueryProvider>
        <PosPage />
      </QueryProvider>,
    );

    const productCard = screen.getAllByText(mockProduct.name).at(-1)!;
    fireEvent.click(productCard);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].product_id).toBe(mockProduct.id);
  });

  it("updates total when product is added", () => {
    render(
      <QueryProvider>
        <PosPage />
      </QueryProvider>,
    );

    const productCard = screen.getAllByText(mockProduct.name).at(-1)!;
    fireEvent.click(productCard);

    const { getTotal } = useCartStore.getState();
    const total = getTotal();
    expect(total).toBeGreaterThan(0);

    // Check if the sidebar updates (CartSidebar is rendered within PosPage)
    expect(screen.getAllByText("Total").length).toBeGreaterThan(0);
  });
});
