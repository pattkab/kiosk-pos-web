export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
};

export const mockOrganization = {
  id: 'org-123',
  name: 'Test Store',
  slug: 'test-store',
  currency: 'USD',
};

export const mockProduct = {
  id: 'prod-123',
  name: 'Test Product',
  description: null,
  sku: 'TEST-SKU',
  barcode: '123456789',
  category_id: null,
  created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  created_by: null,
  expiry_date: null,
  image_url: null,
  organization_id: 'org-123',
  selling_price: 100,
  cost_price: 60,
  stock_quantity: 50,
  low_stock_threshold: 5,
  is_active: true,
  updated_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
};

export const mockCartItem = {
  product_id: 'prod-123',
  name: 'Test Product',
  quantity: 2,
  unit_price: 100,
  unit_cost: 60,
  discount: 0,
};
