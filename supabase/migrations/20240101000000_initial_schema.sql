-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'cashier');
CREATE TYPE transaction_type AS ENUM ('purchase', 'sale', 'adjustment', 'return', 'damage', 'expiry');
CREATE TYPE payment_method AS ENUM ('cash', 'mobile_money', 'card', 'split');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE sale_status AS ENUM ('draft', 'completed', 'cancelled', 'refunded');
CREATE TYPE alert_type AS ENUM ('low_stock', 'expiry', 'failed_transaction');

-- TABLES

-- 1. PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATIONS
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    owner_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERS
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'cashier',
    invited_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

-- 4. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    barcode TEXT,
    sku TEXT,
    image_url TEXT,
    cost_price DECIMAL(12,2) DEFAULT 0,
    selling_price DECIMAL(12,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, barcode),
    UNIQUE(organization_id, sku)
);

-- 6. INVENTORY TRANSACTIONS
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    transaction_type transaction_type NOT NULL,
    notes TEXT,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CUSTOMERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CASH REGISTERS
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REGISTER SESSIONS
CREATE TABLE register_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES profiles(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(12,2),
    actual_closing_balance DECIMAL(12,2),
    discrepancy DECIMAL(12,2),
    notes TEXT
);

-- 10. SALES
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID REFERENCES register_sessions(id),
    cashier_id UUID NOT NULL REFERENCES profiles(id),
    customer_id UUID REFERENCES customers(id),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    sale_status sale_status NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SALE ITEMS
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL
);

-- 12. PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reference TEXT,
    status payment_status NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ALERTS
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    resource_id UUID, -- References product_id or sale_id
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ACTIVITY LOGS
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SETTINGS
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    receipt_header TEXT,
    receipt_footer TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    low_stock_threshold_default INTEGER DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTIONS & TRIGGERS

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Updated At Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cash_registers_updated_at BEFORE UPDATE ON cash_registers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Inventory Management Trigger
CREATE OR REPLACE FUNCTION manage_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;

        INSERT INTO inventory_transactions (organization_id, product_id, quantity_change, transaction_type, performed_by)
        SELECT organization_id, NEW.product_id, -NEW.quantity, 'sale', s.cashier_id
        FROM sales s WHERE s.id = NEW.sale_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_sale_item_insert
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE PROCEDURE manage_inventory_on_sale();

-- Low Stock Alert Trigger
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        INSERT INTO alerts (organization_id, type, title, message, resource_id)
        VALUES (NEW.organization_id, 'low_stock', 'Low Stock Alert', 'Product ' || NEW.name || ' is low on stock: ' || NEW.stock_quantity, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_product_stock_update
AFTER UPDATE OF stock_quantity ON products
FOR EACH ROW EXECUTE PROCEDURE check_low_stock();

-- INDEXES
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_activity_logs_org_id ON activity_logs(organization_id);

-- RLS (ROW LEVEL SECURITY)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper Function for RLS
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id FROM organization_members
    WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid());
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- POLICIES

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = auth_user_id);

-- Organizations: Members can view, only owners can update
CREATE POLICY "Members can view organizations" ON organizations FOR SELECT USING (id IN (SELECT get_user_organizations()));
CREATE POLICY "Owners can update organizations" ON organizations FOR UPDATE USING (owner_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- General Multi-tenant Policy Template for other tables
-- (Replacing placeholders with actual table names in a loop or individually)

-- Example for Products
CREATE POLICY "Members can view products" ON products FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Managers can manage products" ON products FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        AND role IN ('owner', 'admin', 'manager')
    )
);

-- Sales & Payments: Cashiers can insert and view
CREATE POLICY "Members can view sales" ON sales FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Members can insert sales" ON sales FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Members can view sale items" ON sale_items FOR SELECT USING (sale_id IN (SELECT id FROM sales));
CREATE POLICY "Members can insert sale items" ON sale_items FOR INSERT WITH CHECK (sale_id IN (SELECT id FROM sales));

CREATE POLICY "Members can view payments" ON payments FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Members can insert payments" ON payments FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Members can view categories" ON categories FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Managers can manage categories" ON categories FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        AND role IN ('owner', 'admin', 'manager')
    )
);

CREATE POLICY "Members can view customers" ON customers FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Members can manage customers" ON customers FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Members can view sessions" ON register_sessions FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Members can manage sessions" ON register_sessions FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Members can view alerts" ON alerts FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Members can view logs" ON activity_logs FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Members can view settings" ON settings FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
CREATE POLICY "Managers can update settings" ON settings FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        AND role IN ('owner', 'admin', 'manager')
    )
);

