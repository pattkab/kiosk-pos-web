-- Customer loyalty program: settings, balances, ledger, and checkout integration.

ALTER TABLE organization_settings
    ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS loyalty_earn_points_per_unit INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS loyalty_earn_spend_unit DECIMAL(12,2) NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS loyalty_redeem_points_unit INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS loyalty_redeem_value_unit DECIMAL(12,2) NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS loyalty_min_redeem_points INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS loyalty_max_redeem_percent DECIMAL(5,2) NOT NULL DEFAULT 50;

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    points_delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'adjustment')),
    note TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer
    ON loyalty_transactions(organization_id, customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_sale
    ON loyalty_transactions(sale_id)
    WHERE sale_id IS NOT NULL;

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'loyalty_transactions'
          AND policyname = 'Members can view loyalty transactions'
    ) THEN
        CREATE POLICY "Members can view loyalty transactions"
            ON loyalty_transactions FOR SELECT
            USING (organization_id IN (SELECT get_user_organizations()));
    END IF;
END $$;

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
    p_device_id TEXT DEFAULT NULL,
    p_loyalty_points_redeemed INTEGER DEFAULT 0
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
    v_profile_id UUID;
    v_session_id UUID;
    v_settings RECORD;
    v_customer RECORD;
    v_loyalty_enabled BOOLEAN := FALSE;
    v_loyalty_discount DECIMAL(12,2) := 0;
    v_cart_discount DECIMAL(12,2);
    v_points_earned INTEGER := 0;
    v_new_balance INTEGER := 0;
    v_max_redeem_discount DECIMAL(12,2);
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

    SELECT
        loyalty_enabled,
        loyalty_earn_points_per_unit,
        loyalty_earn_spend_unit,
        loyalty_redeem_points_unit,
        loyalty_redeem_value_unit,
        loyalty_min_redeem_points,
        loyalty_max_redeem_percent
    INTO v_settings
    FROM organization_settings
    WHERE organization_id = p_organization_id;

    v_loyalty_enabled := COALESCE(v_settings.loyalty_enabled, FALSE);

    IF p_loyalty_points_redeemed > 0 THEN
        IF p_customer_id IS NULL THEN
            RAISE EXCEPTION 'A customer is required to redeem loyalty points.';
        END IF;

        IF NOT v_loyalty_enabled THEN
            RAISE EXCEPTION 'Loyalty program is not enabled for this organization.';
        END IF;

        IF p_loyalty_points_redeemed < COALESCE(v_settings.loyalty_min_redeem_points, 100) THEN
            RAISE EXCEPTION 'Minimum loyalty redemption not met.';
        END IF;

        SELECT id, loyalty_points
        INTO v_customer
        FROM customers
        WHERE id = p_customer_id
          AND organization_id = p_organization_id
        FOR UPDATE;

        IF v_customer.id IS NULL THEN
            RAISE EXCEPTION 'Customer not found.';
        END IF;

        IF v_customer.loyalty_points < p_loyalty_points_redeemed THEN
            RAISE EXCEPTION 'Insufficient loyalty points.';
        END IF;

        v_loyalty_discount := round(
            (p_loyalty_points_redeemed::DECIMAL / NULLIF(v_settings.loyalty_redeem_points_unit, 0))
            * v_settings.loyalty_redeem_value_unit,
            2
        );

        v_max_redeem_discount := round(
            (p_total_amount + v_loyalty_discount)
            * COALESCE(v_settings.loyalty_max_redeem_percent, 50) / 100,
            2
        );

        IF v_loyalty_discount > v_max_redeem_discount + 0.01 THEN
            RAISE EXCEPTION 'Loyalty redemption exceeds the allowed maximum for this order.';
        END IF;

        v_cart_discount := round(p_discount_amount - v_loyalty_discount, 2);
        IF v_cart_discount < -0.01 THEN
            RAISE EXCEPTION 'Loyalty discount exceeds cart discount total.';
        END IF;
    ELSE
        v_cart_discount := p_discount_amount;
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

    IF ABS((p_subtotal - p_discount_amount + p_tax_amount) - p_total_amount) > 1.00 THEN
        RAISE EXCEPTION 'Sale totals failed validation.';
    END IF;

    v_receipt_number := NULLIF(trim(p_receipt_number), '');
    IF v_receipt_number IS NULL THEN
        v_receipt_number := 'R-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::TEXT, 1, 8));
    END IF;

    IF v_loyalty_enabled AND p_customer_id IS NOT NULL THEN
        v_points_earned := floor(
            (GREATEST(p_total_amount, 0) / NULLIF(v_settings.loyalty_earn_spend_unit, 0))
            * v_settings.loyalty_earn_points_per_unit
        )::INTEGER;
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
        synced_from_offline,
        loyalty_points_earned,
        loyalty_points_redeemed,
        loyalty_discount_amount
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
        p_client_sale_id IS NOT NULL,
        v_points_earned,
        GREATEST(p_loyalty_points_redeemed, 0),
        v_loyalty_discount
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

    IF p_customer_id IS NOT NULL AND v_loyalty_enabled
       AND (p_loyalty_points_redeemed > 0 OR v_points_earned > 0) THEN
        SELECT loyalty_points
        INTO v_customer
        FROM customers
        WHERE id = p_customer_id
          AND organization_id = p_organization_id
        FOR UPDATE;

        v_new_balance := GREATEST(
            COALESCE(v_customer.loyalty_points, 0) - GREATEST(p_loyalty_points_redeemed, 0) + v_points_earned,
            0
        );

        UPDATE customers
        SET loyalty_points = v_new_balance,
            updated_at = NOW()
        WHERE id = p_customer_id;

        IF p_loyalty_points_redeemed > 0 THEN
            INSERT INTO loyalty_transactions (
                organization_id,
                customer_id,
                sale_id,
                points_delta,
                balance_after,
                transaction_type,
                note,
                created_by
            ) VALUES (
                p_organization_id,
                p_customer_id,
                v_sale_id,
                -p_loyalty_points_redeemed,
                v_new_balance - v_points_earned,
                'redeem',
                'Redeemed at checkout ' || v_receipt_number,
                p_cashier_id
            );
        END IF;

        IF v_points_earned > 0 THEN
            INSERT INTO loyalty_transactions (
                organization_id,
                customer_id,
                sale_id,
                points_delta,
                balance_after,
                transaction_type,
                note,
                created_by
            ) VALUES (
                p_organization_id,
                p_customer_id,
                v_sale_id,
                v_points_earned,
                v_new_balance,
                'earn',
                'Earned from sale ' || v_receipt_number,
                p_cashier_id
            );
        END IF;
    END IF;

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
            'device_id', p_device_id,
            'loyalty_points_redeemed', p_loyalty_points_redeemed,
            'loyalty_points_earned', v_points_earned
        )
    );

    RETURN v_sale_id;
END;
$$;
