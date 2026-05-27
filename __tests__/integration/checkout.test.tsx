import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PosPage from '@/app/pos/page';
import { useCartStore } from '@/store/use-cart-store';
import { useSessionStore } from '@/store/use-session-store';
import { QueryProvider } from '@/providers/query-provider';
import { mockProduct } from '../mocks/data';

// Mock the useProducts hook
vi.mock('@/hooks/use-inventory', () => ({
  useProducts: () => ({ data: [mockProduct], isLoading: false }),
  useCategories: () => ({ data: [], isLoading: false }),
}));

// Mock the usePosProducts hook
vi.mock('@/hooks/use-pos', () => ({
  usePosProducts: () => ({ data: [mockProduct], isLoading: false }),
  useBarcodeLookup: () => ({ mutateAsync: vi.fn() }),
  useRegisterSession: () => ({ activeSession: { refetch: vi.fn() } }),
}));

describe('POS Checkout Integration', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useSessionStore.getState().setSession({
      id: 'session-123',
      register_id: 'reg-123',
      opened_at: new Date().toISOString(),
      opening_balance: 100,
    });
  });

  it('adds a product to the cart when clicked', async () => {
    render(
      <QueryProvider>
        <PosPage />
      </QueryProvider>
    );

    const productCard = screen.getByText(mockProduct.name);
    fireEvent.click(productCard);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].product_id).toBe(mockProduct.id);
  });

  it('updates total when product is added', () => {
    render(
      <QueryProvider>
        <PosPage />
      </QueryProvider>
    );

    const productCard = screen.getByText(mockProduct.name);
    fireEvent.click(productCard);

    const { getTotal } = useCartStore.getState();
    const total = getTotal();
    expect(total).toBeGreaterThan(0);

    // Check if the sidebar updates (CartSidebar is rendered within PosPage)
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });
});
