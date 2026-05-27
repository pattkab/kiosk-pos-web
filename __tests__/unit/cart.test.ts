import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/store/use-cart-store';
import { mockProduct } from '../mocks/data';

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('adds an item to the cart', () => {
    const { addItem } = useCartStore.getState();
    addItem(mockProduct);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].product_id).toBe(mockProduct.id);
    expect(items[0].quantity).toBe(1);
  });

  it('increments quantity when adding same product', () => {
    const { addItem } = useCartStore.getState();
    addItem(mockProduct);
    addItem(mockProduct);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('updates item quantity', () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    addItem(mockProduct);
    updateQuantity(mockProduct.id, 5);

    const { items } = useCartStore.getState();
    expect(items[0].quantity).toBe(5);
  });

  it('calculates totals correctly', () => {
    const { addItem, setTaxRate, getSubtotal, getTaxAmount, getTotal } = useCartStore.getState();

    addItem({ ...mockProduct, selling_price: 100 }); // $100
    addItem({ ...mockProduct, id: 'prod-456', name: 'Other', selling_price: 50 }); // $50

    setTaxRate(0.1); // 10%

    expect(getSubtotal()).toBe(150);
    expect(getTaxAmount()).toBe(15);
    expect(getTotal()).toBe(165);
  });

  it('removes an item', () => {
    const { addItem, removeItem } = useCartStore.getState();
    addItem(mockProduct);
    removeItem(mockProduct.id);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });
});
