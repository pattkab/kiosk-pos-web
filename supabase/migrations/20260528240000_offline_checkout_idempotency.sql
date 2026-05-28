-- Offline checkout: idempotent sales by client_sale_id and optional offline receipt numbers.

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS client_sale_id UUID,
    ADD COLUMN IF NOT EXISTS device_id TEXT,
    ADD COLUMN IF NOT EXISTS synced_from_offline BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_org_client_sale_id
    ON sales(organization_id, client_sale_id)
    WHERE client_sale_id IS NOT NULL;

CREATE OR REPLACE FUNCTION process_checkout(
    p_organization_id UUID,
    p_cashier_id UUID,
    p_session_id UUID,
    p_customer_id UUID,
    p_subtotal DECIMAL(12,2),
    p_tax_amount DECIMAL(12,2),
    p_discount_amount DECIMAL(12,2),
    p_total_amount DECIMAL(12,2),
    p_items JSONB,
    p_payments JSONB,
    p_client_sale_id UUID DEFAULT NULL,
    p_receipt_number TEXT DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
    v_receipt_number TEXT;
    v_item RECORD;
    v_payment RECORD;
    v_product RECORD;
    v_payment_total DECIMAL(12,2);
    v_item_total DECIMAL(12,2);
    v_profile_id UUID;
    v_session_id UUID;
BEGIN
    IF p_client_sale_id IS NOT NULL THEN
        SELECT id INTO v_sale_id
        FROM sales
        WHERE organization_id = p_organization_id
          AND client_sale_id = p_client_sale_id
        LIMIT 1;

        IF v_sale_id IS NOT NULL THEN
            RETURN v_sale_id;
        END IF;
    END IF;

    SELECT id INTO v_profile_id
    FROM profiles
    WHERE auth_user_id = auth.uid();

    IF v_profile_id IS NULL OR v_profile_id <> p_cashier_id THEN
        RAISE EXCEPTION 'Unauthorized cashier.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM organization_members
        WHERE organization_id = p_organization_id
          AND profile_id = p_cashier_id
          AND role IN ('owner', 'admin', 'manager', 'cashier')
    ) THEN
        RAISE EXCEPTION 'Cashier is not a member of this organization.';
    END IF;

    SELECT id INTO v_session_id
    FROM register_sessions
    WHERE id = p_session_id
      AND organization_id = p_organization_id
      AND cashier_id = p_cashier_id
      AND closed_at IS NULL
    FOR UPDATE;

    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'No active register session for this cashier.';
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty.';
    END IF;

    IF jsonb_array_length(p_payments) = 0 THEN
        RAISE EXCEPTION 'At least one payment is required.';
    END IF;

    SELECT COALESCE(SUM((payment_row.amount)::DECIMAL(12,2)), 0)
    INTO v_payment_total
    FROM jsonb_to_recordset(p_payments) AS payment_row(
        payment_method payment_method,
        amount DECIMAL(12,2),
        reference TEXT
    );

    IF v_payment_total < p_total_amount THEN
        RAISE EXCEPTION 'Payment total is less than sale total.';
    END IF;

    SELECT COALESCE(SUM((item_row.line_total)::DECIMAL(12,2)), 0)
    INTO v_item_total
    FROM jsonb_to_recordset(p_items) AS item_row(
        product_id UUID,
        name TEXT,
        quantity INTEGER,
        unit_price DECIMAL(12,2),
        unit_cost DECIMAL(12,2),
        discount_amount DECIMAL(12,2),
        tax_amount DECIMAL(12,2),
        line_total DECIMAL(12,2),
        note TEXT
    );

    IF ABS((p_subtotal - p_discount_amount + p_tax_amount) - p_total_amount) > 1.00 THEN
        RAISE EXCEPTION 'Sale totals failed validation.';
    END IF;

    v_receipt_number := NULLIF(trim(p_receipt_number), '');
    IF v_receipt_number IS NULL THEN
        v_receipt_number := 'R-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::TEXT, 1, 8));
    END IF;

    INSERT INTO sales (
        organization_id,
        cashier_id,
        session_id,
        customer_id,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_status,
        sale_status,
        receipt_number,
        client_sale_id,
        device_id,
        synced_from_offline
    ) VALUES (
        p_organization_id,
        p_cashier_id,
        p_session_id,
        p_customer_id,
        p_subtotal,
        p_tax_amount,
        p_discount_amount,
        p_total_amount,
        'completed',
        'completed',
        v_receipt_number,
        p_client_sale_id,
        p_device_id,
        p_client_sale_id IS NOT NULL
    ) RETURNING id INTO v_sale_id;

    FOR v_item IN
        SELECT *
        FROM jsonb_to_recordset(p_items) AS item_row(
            product_id UUID,
            name TEXT,
            quantity INTEGER,
            unit_price DECIMAL(12,2),
            unit_cost DECIMAL(12,2),
            discount_amount DECIMAL(12,2),
            tax_amount DECIMAL(12,2),
            line_total DECIMAL(12,2),
            note TEXT
        )
    LOOP
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity for product: %', v_item.name;
        END IF;

        SELECT id, name, stock_quantity, organization_id
        INTO v_product
        FROM products
        WHERE id = v_item.product_id
          AND organization_id = p_organization_id
          AND is_active = TRUE
        FOR UPDATE;

        IF v_product.id IS NULL THEN
            RAISE EXCEPTION 'Product is unavailable: %', v_item.name;
        END IF;

        IF v_product.stock_quantity < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %. Available: %, requested: %',
                v_product.name,
                v_product.stock_quantity,
                v_item.quantity;
        END IF;

        UPDATE products
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE id = v_item.product_id
          AND stock_quantity >= v_item.quantity;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inventory changed while checking out %. Please retry.', v_product.name;
        END IF;

        INSERT INTO sale_items (
            sale_id,
            product_id,
            product_name_snapshot,
            quantity,
            unit_price,
            unit_cost,
            discount_amount,
            tax_amount,
            line_total,
            note
        ) VALUES (
            v_sale_id,
            v_item.product_id,
            v_product.name,
            v_item.quantity,
            v_item.unit_price,
            v_item.unit_cost,
            COALESCE(v_item.discount_amount, 0),
            COALESCE(v_item.tax_amount, 0),
            v_item.line_total,
            NULLIF(v_item.note, '')
        );

        INSERT INTO inventory_transactions (
            organization_id,
            product_id,
            quantity_change,
            transaction_type,
            notes,
            performed_by
        ) VALUES (
            p_organization_id,
            v_item.product_id,
            -v_item.quantity,
            'sale',
            'Sale ' || v_receipt_number,
            p_cashier_id
        );
    END LOOP;

    FOR v_payment IN
        SELECT *
        FROM jsonb_to_recordset(p_payments) AS payment_row(
            payment_method payment_method,
            amount DECIMAL(12,2),
            reference TEXT
        )
    LOOP
        IF v_payment.amount <= 0 THEN
            RAISE EXCEPTION 'Payment amount must be positive.';
        END IF;

        INSERT INTO payments (
            organization_id,
            sale_id,
            payment_method,
            amount,
            reference,
            status
        ) VALUES (
            p_organization_id,
            v_sale_id,
            v_payment.payment_method,
            v_payment.amount,
            NULLIF(v_payment.reference, ''),
            'completed'
        );
    END LOOP;

    INSERT INTO activity_logs (
        organization_id,
        profile_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_organization_id,
        p_cashier_id,
        'COMPLETE_SALE',
        'sale',
        v_sale_id,
        jsonb_build_object(
            'total', p_total_amount,
            'receipt_number', v_receipt_number,
            'payment_total', v_payment_total,
            'client_sale_id', p_client_sale_id,
            'device_id', p_device_id
        )
    );

    RETURN v_sale_id;
END;
$$;
