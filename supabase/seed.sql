-- SEED DATA

-- Note: In a real Supabase environment, you'd create users in auth.users first.
-- This script assumes profiles are linked to existing auth users or created manually for demo.

-- 1. Create a dummy profile (linked to a mock UUID)
INSERT INTO profiles (id, auth_user_id, full_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com');

-- 2. Create an Organization
INSERT INTO organizations (id, name, slug, owner_id, currency)
VALUES ('11111111-1111-1111-1111-111111111111', 'Main Store', 'main-store', '00000000-0000-0000-0000-000000000001', 'USD');

-- 3. Add Member
INSERT INTO organization_members (organization_id, profile_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'owner');

-- 4. Create Categories
INSERT INTO categories (id, organization_id, name)
VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Electronics'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Groceries');

-- 5. Create Products
INSERT INTO products (organization_id, category_id, name, barcode, sku, cost_price, selling_price, stock_quantity)
VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'iPhone 15', '123456789', 'IPH15-001', 800.00, 999.00, 50),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'MacBook Air', '987654321', 'MBA-M2-001', 1000.00, 1199.00, 20),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Organic Coffee', '555666777', 'COF-ORG-01', 10.00, 15.50, 100);

-- 6. Create a Cash Register
INSERT INTO cash_registers (id, organization_id, name)
VALUES ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Front Counter');

-- 7. Setup Organization Settings
INSERT INTO settings (organization_id, receipt_header, tax_rate)
VALUES ('11111111-1111-1111-1111-111111111111', 'Welcome to Main Store', 8.5);
