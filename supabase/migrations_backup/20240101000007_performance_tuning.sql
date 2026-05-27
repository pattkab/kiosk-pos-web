-- 1. ADVANCED INDEXING FOR SEARCH & ORGANIZATION ISOLATION
-- Composite indexes for the most common query patterns

-- Products: Organization + Barcode/SKU (O(log n) lookup for POS)
CREATE INDEX IF NOT EXISTS idx_products_org_barcode ON products (organization_id, barcode) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_org_sku ON products (organization_id, sku) WHERE is_active = true;

-- Sales: Date-based range scans for reports
CREATE INDEX IF NOT EXISTS idx_sales_org_created_at ON sales (organization_id, created_at DESC);

-- Inventory Transactions: Fast history lookup per product
CREATE INDEX IF NOT EXISTS idx_inv_tx_product_created ON inventory_transactions (product_id, created_at DESC);

-- Payments: Aggregation by method
CREATE INDEX IF NOT EXISTS idx_payments_org_method ON payments (organization_id, payment_method);

-- 2. FULL TEXT SEARCH OPTIMIZATION
-- Create a GIN index on product names for fuzzy search using trigrams
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- 3. OPTIMIZED REPORTING VIEWS
-- Use views to pre-calculate common aggregations to avoid heavy client-side logic

CREATE OR REPLACE VIEW dashboard_summaries AS
SELECT
    organization_id,
    COUNT(id) filter (where created_at >= date_trunc('day', now())) as daily_sales_count,
    SUM(total_amount) filter (where created_at >= date_trunc('day', now())) as daily_revenue,
    SUM(total_amount) filter (where created_at >= date_trunc('month', now())) as monthly_revenue
FROM sales
WHERE sale_status = 'completed'
GROUP BY organization_id;

-- 4. RPC FOR BATCHED DASHBOARD DATA
-- Reduces 5-6 network calls to 1 call
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'revenue_today', COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0),
        'sales_count_today', COUNT(id) FILTER (WHERE created_at >= CURRENT_DATE),
        'low_stock_count', (SELECT COUNT(*) FROM products WHERE organization_id = p_org_id AND stock_quantity <= low_stock_threshold AND is_active = true),
        'total_inventory_value', (SELECT SUM(stock_quantity * cost_price) FROM products WHERE organization_id = p_org_id AND is_active = true),
        'recent_sales', (
            SELECT jsonb_agg(rs) FROM (
                SELECT id, total_amount, created_at
                FROM sales
                WHERE organization_id = p_org_id
                ORDER BY created_at DESC LIMIT 5
            ) rs
        )
    ) INTO v_result
    FROM sales
    WHERE organization_id = p_org_id AND sale_status = 'completed';

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
