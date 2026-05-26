-- ANALYTICS & REPORTING FUNCTIONS

-- 1. Daily Sales Summary
CREATE OR REPLACE FUNCTION get_daily_sales_summary(org_id UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    sale_date DATE,
    total_sales DECIMAL(12,2),
    total_orders BIGINT,
    avg_order_value DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        created_at::DATE as sale_date,
        SUM(total_amount) as total_sales,
        COUNT(id) as total_orders,
        AVG(total_amount) as avg_order_value
    FROM sales
    WHERE organization_id = org_id
    AND created_at::DATE BETWEEN start_date AND end_date
    AND sale_status = 'completed'
    GROUP BY sale_date
    ORDER BY sale_date DESC;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 2. Top Selling Products
CREATE OR REPLACE FUNCTION get_top_selling_products(org_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    total_quantity BIGINT,
    total_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        si.product_id,
        si.product_name_snapshot as product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.line_total) as total_revenue
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.organization_id = org_id
    AND s.sale_status = 'completed'
    GROUP BY si.product_id, si.product_name_snapshot
    ORDER BY total_revenue DESC
    LIMIT limit_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 3. Inventory Valuation
CREATE OR REPLACE FUNCTION get_inventory_valuation(org_id UUID)
RETURNS TABLE (
    total_items BIGINT,
    total_cost_value DECIMAL(12,2),
    total_selling_value DECIMAL(12,2),
    potential_profit DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(stock_quantity) as total_items,
        SUM(stock_quantity * cost_price) as total_cost_value,
        SUM(stock_quantity * selling_price) as total_selling_value,
        SUM(stock_quantity * (selling_price - cost_price)) as potential_profit
    FROM products
    WHERE organization_id = org_id
    AND is_active = TRUE;
END;
$$ language 'plpgsql' SECURITY DEFINER;
