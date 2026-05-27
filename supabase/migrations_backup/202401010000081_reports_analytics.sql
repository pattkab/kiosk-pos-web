-- Production reports and analytics RPCs.

CREATE INDEX IF NOT EXISTS idx_sales_org_status_created
    ON sales(organization_id, sale_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_org_session_created
    ON sales(organization_id, session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id_product
    ON sale_items(sale_id, product_id);

CREATE INDEX IF NOT EXISTS idx_payments_org_method_created
    ON payments(organization_id, payment_method, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_org_active_expiry
    ON products(organization_id, is_active, expiry_date);

CREATE OR REPLACE FUNCTION can_view_reports(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members om
        JOIN profiles p ON p.id = om.profile_id
        WHERE om.organization_id = p_organization_id
          AND p.auth_user_id = auth.uid()
          AND om.role IN ('owner', 'admin', 'manager')
    );
$$;

CREATE OR REPLACE FUNCTION require_report_access(p_organization_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT can_view_reports(p_organization_id) THEN
        RAISE EXCEPTION 'Reports are restricted to owners, admins, and managers.';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_report_kpis(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_revenue DECIMAL(12,2),
    gross_profit DECIMAL(12,2),
    total_sales BIGINT,
    average_order_value DECIMAL(12,2),
    total_items_sold BIGINT,
    best_selling_product TEXT,
    low_stock_count BIGINT,
    expiring_products_count BIGINT,
    cash_payments DECIMAL(12,2),
    digital_payments DECIMAL(12,2),
    active_cashiers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    WITH completed_sales AS (
        SELECT *
        FROM sales
        WHERE organization_id = p_organization_id
          AND sale_status = 'completed'
          AND created_at::DATE BETWEEN p_start_date AND p_end_date
    ),
    item_totals AS (
        SELECT
            COALESCE(SUM(si.quantity), 0)::BIGINT AS items_sold,
            COALESCE(SUM(si.line_total - (si.unit_cost * si.quantity)), 0)::DECIMAL(12,2) AS profit
        FROM sale_items si
        JOIN completed_sales s ON s.id = si.sale_id
    ),
    best_product AS (
        SELECT si.product_name_snapshot AS product_name
        FROM sale_items si
        JOIN completed_sales s ON s.id = si.sale_id
        GROUP BY si.product_name_snapshot
        ORDER BY SUM(si.quantity) DESC, SUM(si.line_total) DESC
        LIMIT 1
    ),
    payment_totals AS (
        SELECT
            COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0)::DECIMAL(12,2) AS cash_total,
            COALESCE(SUM(CASE WHEN payment_method <> 'cash' THEN amount ELSE 0 END), 0)::DECIMAL(12,2) AS digital_total
        FROM payments p
        JOIN completed_sales s ON s.id = p.sale_id
        WHERE p.status = 'completed'
    ),
    stock_counts AS (
        SELECT
            COUNT(*) FILTER (WHERE stock_quantity <= low_stock_threshold)::BIGINT AS low_stock,
            COUNT(*) FILTER (
                WHERE expiry_date IS NOT NULL
                  AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            )::BIGINT AS expiring
        FROM products
        WHERE organization_id = p_organization_id
          AND is_active = TRUE
    ),
    sales_summary AS (
        SELECT
            COALESCE(SUM(total_amount), 0)::DECIMAL(12,2) AS revenue,
            COUNT(id)::BIGINT AS sale_count,
            COALESCE(AVG(total_amount), 0)::DECIMAL(12,2) AS average_order,
            COUNT(DISTINCT cashier_id)::BIGINT AS cashier_count
        FROM completed_sales
    )
    SELECT
        sales_summary.revenue,
        item_totals.profit,
        sales_summary.sale_count,
        sales_summary.average_order,
        item_totals.items_sold,
        (SELECT product_name FROM best_product),
        stock_counts.low_stock,
        stock_counts.expiring,
        payment_totals.cash_total,
        payment_totals.digital_total,
        sales_summary.cashier_count
    FROM sales_summary
    CROSS JOIN item_totals
    CROSS JOIN payment_totals
    CROSS JOIN stock_counts;
END;
$$;

CREATE OR REPLACE FUNCTION get_revenue_trend(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    period DATE,
    revenue DECIMAL(12,2),
    sales_count BIGINT,
    gross_profit DECIMAL(12,2),
    items_sold BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    WITH days AS (
        SELECT generate_series(p_start_date, p_end_date, INTERVAL '1 day')::DATE AS day
    ),
    sale_totals AS (
        SELECT
            s.created_at::DATE AS day,
            SUM(s.total_amount)::DECIMAL(12,2) AS revenue,
            COUNT(s.id)::BIGINT AS sales_count
        FROM sales s
        WHERE s.organization_id = p_organization_id
          AND s.sale_status = 'completed'
          AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
        GROUP BY s.created_at::DATE
    ),
    item_totals AS (
        SELECT
            s.created_at::DATE AS day,
            SUM(si.quantity)::BIGINT AS items_sold,
            SUM(si.line_total - (si.unit_cost * si.quantity))::DECIMAL(12,2) AS gross_profit
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.organization_id = p_organization_id
          AND s.sale_status = 'completed'
          AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
        GROUP BY s.created_at::DATE
    )
    SELECT
        days.day,
        COALESCE(sale_totals.revenue, 0)::DECIMAL(12,2),
        COALESCE(sale_totals.sales_count, 0)::BIGINT,
        COALESCE(item_totals.gross_profit, 0)::DECIMAL(12,2),
        COALESCE(item_totals.items_sold, 0)::BIGINT
    FROM days
    LEFT JOIN sale_totals ON sale_totals.day = days.day
    LEFT JOIN item_totals ON item_totals.day = days.day
    ORDER BY days.day;
END;
$$;

CREATE OR REPLACE FUNCTION get_product_performance(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    quantity_sold BIGINT,
    revenue DECIMAL(12,2),
    cost DECIMAL(12,2),
    gross_profit DECIMAL(12,2),
    margin_percent DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    SELECT
        si.product_id,
        si.product_name_snapshot,
        SUM(si.quantity)::BIGINT,
        SUM(si.line_total)::DECIMAL(12,2),
        SUM(si.unit_cost * si.quantity)::DECIMAL(12,2),
        SUM(si.line_total - (si.unit_cost * si.quantity))::DECIMAL(12,2),
        CASE
            WHEN SUM(si.line_total) = 0 THEN 0
            ELSE ((SUM(si.line_total - (si.unit_cost * si.quantity)) / SUM(si.line_total)) * 100)::DECIMAL(12,2)
        END
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.organization_id = p_organization_id
      AND s.sale_status = 'completed'
      AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY si.product_id, si.product_name_snapshot
    ORDER BY SUM(si.line_total) DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_payment_breakdown(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    payment_method payment_method,
    total_amount DECIMAL(12,2),
    payment_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    SELECT
        p.payment_method,
        SUM(p.amount)::DECIMAL(12,2),
        COUNT(p.id)::BIGINT
    FROM payments p
    JOIN sales s ON s.id = p.sale_id
    WHERE p.organization_id = p_organization_id
      AND p.status = 'completed'
      AND s.sale_status = 'completed'
      AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY p.payment_method
    ORDER BY SUM(p.amount) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_cashier_performance(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    cashier_id UUID,
    cashier_name TEXT,
    sales_count BIGINT,
    revenue DECIMAL(12,2),
    average_order_value DECIMAL(12,2),
    gross_profit DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    SELECT
        s.cashier_id,
        COALESCE(pr.full_name, pr.email, 'Cashier'),
        COUNT(DISTINCT s.id)::BIGINT,
        SUM(s.total_amount)::DECIMAL(12,2),
        AVG(s.total_amount)::DECIMAL(12,2),
        COALESCE(SUM(si.line_total - (si.unit_cost * si.quantity)), 0)::DECIMAL(12,2)
    FROM sales s
    JOIN profiles pr ON pr.id = s.cashier_id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE s.organization_id = p_organization_id
      AND s.sale_status = 'completed'
      AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY s.cashier_id, pr.full_name, pr.email
    ORDER BY SUM(s.total_amount) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_inventory_valuation_report(p_organization_id UUID)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    sku TEXT,
    category_name TEXT,
    stock_quantity INTEGER,
    low_stock_threshold INTEGER,
    cost_price DECIMAL(12,2),
    selling_price DECIMAL(12,2),
    cost_value DECIMAL(12,2),
    selling_value DECIMAL(12,2),
    potential_profit DECIMAL(12,2),
    expiry_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.sku,
        c.name,
        COALESCE(p.stock_quantity, 0),
        COALESCE(p.low_stock_threshold, 0),
        COALESCE(p.cost_price, 0)::DECIMAL(12,2),
        COALESCE(p.selling_price, 0)::DECIMAL(12,2),
        (COALESCE(p.stock_quantity, 0) * COALESCE(p.cost_price, 0))::DECIMAL(12,2),
        (COALESCE(p.stock_quantity, 0) * COALESCE(p.selling_price, 0))::DECIMAL(12,2),
        (COALESCE(p.stock_quantity, 0) * (COALESCE(p.selling_price, 0) - COALESCE(p.cost_price, 0)))::DECIMAL(12,2),
        p.expiry_date
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.organization_id = p_organization_id
      AND p.is_active = TRUE
    ORDER BY (COALESCE(p.stock_quantity, 0) * COALESCE(p.selling_price, 0)) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_sales_report(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_limit INTEGER DEFAULT 500
)
RETURNS TABLE (
    sale_id UUID,
    receipt_number TEXT,
    created_at TIMESTAMPTZ,
    cashier_name TEXT,
    subtotal DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    payment_status payment_status,
    sale_status sale_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    SELECT
        s.id,
        s.receipt_number,
        s.created_at,
        COALESCE(p.full_name, p.email, 'Cashier'),
        s.subtotal,
        s.tax_amount,
        s.discount_amount,
        s.total_amount,
        s.payment_status,
        s.sale_status
    FROM sales s
    JOIN profiles p ON p.id = s.cashier_id
    WHERE s.organization_id = p_organization_id
      AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
    ORDER BY s.created_at DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_sale_items_report(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    sale_id UUID,
    created_at TIMESTAMPTZ,
    product_id UUID,
    product_name TEXT,
    quantity INTEGER,
    unit_price DECIMAL(12,2),
    unit_cost DECIMAL(12,2),
    line_total DECIMAL(12,2),
    gross_profit DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    SELECT
        s.id,
        s.created_at,
        si.product_id,
        si.product_name_snapshot,
        si.quantity,
        si.unit_price,
        si.unit_cost,
        si.line_total,
        (si.line_total - (si.unit_cost * si.quantity))::DECIMAL(12,2)
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.organization_id = p_organization_id
      AND s.created_at::DATE BETWEEN p_start_date AND p_end_date
    ORDER BY s.created_at DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION get_register_sessions_report(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    session_id UUID,
    register_name TEXT,
    cashier_name TEXT,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opening_balance DECIMAL(12,2),
    closing_balance DECIMAL(12,2),
    actual_closing_balance DECIMAL(12,2),
    discrepancy DECIMAL(12,2),
    sales_count BIGINT,
    cash_total DECIMAL(12,2),
    total_revenue DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    WITH session_sales AS (
        SELECT
            session_id,
            COUNT(id)::BIGINT AS sales_count,
            SUM(total_amount)::DECIMAL(12,2) AS total_revenue
        FROM sales
        WHERE organization_id = p_organization_id
          AND sale_status = 'completed'
        GROUP BY session_id
    ),
    session_cash AS (
        SELECT
            s.session_id,
            SUM(pay.amount)::DECIMAL(12,2) AS cash_total
        FROM payments pay
        JOIN sales s ON s.id = pay.sale_id
        WHERE pay.organization_id = p_organization_id
          AND pay.status = 'completed'
          AND pay.payment_method = 'cash'
          AND s.sale_status = 'completed'
        GROUP BY s.session_id
    )
    SELECT
        rs.id,
        cr.name,
        COALESCE(p.full_name, p.email, 'Cashier'),
        rs.opened_at,
        rs.closed_at,
        rs.opening_balance,
        rs.closing_balance,
        rs.actual_closing_balance,
        rs.discrepancy,
        COALESCE(session_sales.sales_count, 0)::BIGINT,
        COALESCE(session_cash.cash_total, 0)::DECIMAL(12,2),
        COALESCE(session_sales.total_revenue, 0)::DECIMAL(12,2)
    FROM register_sessions rs
    JOIN cash_registers cr ON cr.id = rs.register_id
    JOIN profiles p ON p.id = rs.cashier_id
    LEFT JOIN session_sales ON session_sales.session_id = rs.id
    LEFT JOIN session_cash ON session_cash.session_id = rs.id
    WHERE rs.organization_id = p_organization_id
      AND rs.opened_at::DATE BETWEEN p_start_date AND p_end_date
    ORDER BY rs.opened_at DESC;
END;
$$;
