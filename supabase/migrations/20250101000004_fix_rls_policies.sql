-- Fix RLS for Products to ensure INSERT works correctly
DROP POLICY IF EXISTS "Managers can manage products" ON products;
CREATE POLICY "Managers can manage products" ON products
FOR ALL USING (
    organization_id IN (SELECT get_user_organizations())
) WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
);

-- Fix RLS for Categories
DROP POLICY IF EXISTS "Managers can manage categories" ON categories;
CREATE POLICY "Managers can manage categories" ON categories
FOR ALL USING (
    organization_id IN (SELECT get_user_organizations())
) WITH CHECK (
    organization_id IN (SELECT get_user_organizations())
);

-- Ensure inventory_transactions has policies (was missing explicit ones in some cases)
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view transactions" ON inventory_transactions;
CREATE POLICY "Members can view transactions" ON inventory_transactions
FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

DROP POLICY IF EXISTS "Members can insert transactions" ON inventory_transactions;
CREATE POLICY "Members can insert transactions" ON inventory_transactions
FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organizations()));
