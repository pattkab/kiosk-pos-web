-- INVENTORY HISTORY FUNCTION
CREATE OR REPLACE FUNCTION get_product_history(prod_id UUID)
RETURNS TABLE (
    id UUID,
    quantity_change INTEGER,
    transaction_type transaction_type,
    notes TEXT,
    performed_by_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        it.id,
        it.quantity_change,
        it.transaction_type,
        it.notes,
        p.full_name as performed_by_name,
        it.created_at
    FROM inventory_transactions it
    LEFT JOIN profiles p ON p.id = it.performed_by
    WHERE it.product_id = prod_id
    ORDER BY it.created_at DESC;
END;
$$ language 'plpgsql' SECURITY DEFINER;
