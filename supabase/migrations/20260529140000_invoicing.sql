-- Invoicing: auto-create invoice per completed sale + receipt reprint RPC.

ALTER TABLE organization_settings
    ADD COLUMN IF NOT EXISTS invoices_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS invoice_prefix TEXT NOT NULL DEFAULT 'INV',
    ADD COLUMN IF NOT EXISTS invoice_footer TEXT;

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL UNIQUE REFERENCES sales(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid'
        CHECK (status IN ('draft', 'issued', 'paid', 'void')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_org_number
    ON invoices(organization_id, invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoices_org_issued
    ON invoices(organization_id, issued_at DESC);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'invoices'
          AND policyname = 'Members can view invoices'
    ) THEN
        CREATE POLICY "Members can view invoices"
            ON invoices FOR SELECT
            USING (organization_id IN (SELECT get_user_organizations()));
    END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_invoice_number(p_organization_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_prefix TEXT := 'INV';
    v_candidate TEXT;
BEGIN
    SELECT COALESCE(NULLIF(btrim(invoice_prefix), ''), 'INV')
    INTO v_prefix
    FROM organization_settings
    WHERE organization_id = p_organization_id;

    LOOP
        v_candidate := upper(v_prefix)
            || '-'
            || to_char(NOW(), 'YYYYMMDD')
            || '-'
            || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8));

        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM invoices
            WHERE organization_id = p_organization_id
              AND invoice_number = v_candidate
        );
    END LOOP;

    RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION ensure_invoice_for_sale(p_sale_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale sales%ROWTYPE;
    v_customer customers%ROWTYPE;
    v_settings organization_settings%ROWTYPE;
    v_invoice_id UUID;
    v_invoice_number TEXT;
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id;
    IF v_sale.id IS NULL OR v_sale.sale_status <> 'completed' THEN
        RETURN NULL;
    END IF;

    SELECT id INTO v_invoice_id FROM invoices WHERE sale_id = p_sale_id;
    IF v_invoice_id IS NOT NULL THEN
        RETURN v_invoice_id;
    END IF;

    SELECT * INTO v_settings
    FROM organization_settings
    WHERE organization_id = v_sale.organization_id;

    IF COALESCE(v_settings.invoices_enabled, TRUE) IS NOT TRUE THEN
        RETURN NULL;
    END IF;

    IF v_sale.customer_id IS NOT NULL THEN
        SELECT * INTO v_customer FROM customers WHERE id = v_sale.customer_id;
    END IF;

    v_invoice_number := generate_invoice_number(v_sale.organization_id);

    INSERT INTO invoices (
        organization_id,
        sale_id,
        invoice_number,
        status,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        notes
    ) VALUES (
        v_sale.organization_id,
        v_sale.id,
        v_invoice_number,
        'paid',
        v_sale.customer_id,
        v_customer.full_name,
        v_customer.email,
        v_customer.phone,
        v_sale.subtotal,
        v_sale.tax_amount,
        v_sale.discount_amount,
        v_sale.total_amount,
        v_sale.receipt_number
    )
    ON CONFLICT (sale_id) DO UPDATE
        SET updated_at = NOW()
    RETURNING id INTO v_invoice_id;

    RETURN v_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_invoice_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.sale_status = 'completed' THEN
        PERFORM ensure_invoice_for_sale(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_create_invoice ON sales;
CREATE TRIGGER sales_create_invoice
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_on_sale();

CREATE OR REPLACE FUNCTION can_access_sale_receipt(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p_organization_id IN (SELECT get_user_organizations());
$$;

CREATE OR REPLACE FUNCTION get_sale_receipt_detail(p_sale_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale sales%ROWTYPE;
    v_org organizations%ROWTYPE;
    v_cashier profiles%ROWTYPE;
    v_settings organization_settings%ROWTYPE;
    v_invoice invoices%ROWTYPE;
    v_items JSONB;
    v_payments JSONB;
    v_payment_total DECIMAL(12,2) := 0;
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id;
    IF v_sale.id IS NULL THEN
        RAISE EXCEPTION 'Sale not found.';
    END IF;

    IF NOT can_access_sale_receipt(v_sale.organization_id) THEN
        RAISE EXCEPTION 'You do not have access to this receipt.';
    END IF;

    PERFORM ensure_invoice_for_sale(v_sale.id);

    SELECT * INTO v_org FROM organizations WHERE id = v_sale.organization_id;
    SELECT * INTO v_cashier FROM profiles WHERE id = v_sale.cashier_id;
    SELECT * INTO v_settings FROM organization_settings WHERE organization_id = v_sale.organization_id;
    SELECT * INTO v_invoice FROM invoices WHERE sale_id = v_sale.id;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_id', si.product_id,
            'name', si.product_name_snapshot,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'unit_cost', si.unit_cost,
            'stock_quantity', 0,
            'tax_rate', 0,
            'tax_mode', 'exclusive',
            'discount', CASE
                WHEN COALESCE(si.discount_amount, 0) > 0 THEN jsonb_build_object(
                    'type', 'fixed',
                    'value', si.discount_amount
                )
                ELSE NULL
            END,
            'note', COALESCE(si.note, '')
        )
        ORDER BY si.id
    ), '[]'::jsonb)
    INTO v_items
    FROM sale_items si
    WHERE si.sale_id = v_sale.id;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'payment_method', p.payment_method,
            'amount', p.amount,
            'reference', COALESCE(p.reference, '')
        )
        ORDER BY p.created_at
    ), '[]'::jsonb)
    INTO v_payments
    FROM payments p
    WHERE p.sale_id = v_sale.id;

    SELECT COALESCE(SUM(amount), 0)
    INTO v_payment_total
    FROM payments
    WHERE sale_id = v_sale.id;

    RETURN jsonb_build_object(
        'saleId', v_sale.id,
        'receiptNumber', v_sale.receipt_number,
        'invoiceNumber', v_invoice.invoice_number,
        'invoiceId', v_invoice.id,
        'organizationName', v_org.name,
        'cashierName', COALESCE(v_cashier.full_name, v_cashier.email, 'Cashier'),
        'createdAt', v_sale.created_at,
        'items', v_items,
        'subtotal', v_sale.subtotal,
        'taxAmount', v_sale.tax_amount,
        'discountAmount', v_sale.discount_amount,
        'totalAmount', v_sale.total_amount,
        'payments', v_payments,
        'changeDue', GREATEST(v_payment_total - v_sale.total_amount, 0),
        'loyaltyPointsRedeemed', v_sale.loyalty_points_redeemed,
        'loyaltyPointsEarned', v_sale.loyalty_points_earned,
        'loyaltyDiscountAmount', v_sale.loyalty_discount_amount,
        'receiptHeader', v_settings.receipt_header,
        'receiptFooter', COALESCE(v_settings.invoice_footer, v_settings.receipt_footer),
        'receiptLogoUrl', v_org.logo_url,
        'receiptNotes', v_settings.receipt_notes,
        'customerName', v_invoice.customer_name,
        'customerEmail', v_invoice.customer_email,
        'customerPhone', v_invoice.customer_phone
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_invoices_report(
    p_organization_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_limit INTEGER DEFAULT 500
)
RETURNS TABLE (
    invoice_id UUID,
    sale_id UUID,
    invoice_number TEXT,
    receipt_number TEXT,
    issued_at TIMESTAMPTZ,
    customer_name TEXT,
    cashier_name TEXT,
    total_amount DECIMAL(12,2),
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM require_report_access(p_organization_id);

    RETURN QUERY
    SELECT
        i.id,
        i.sale_id,
        i.invoice_number,
        s.receipt_number,
        i.issued_at,
        COALESCE(i.customer_name, 'Walk-in'),
        COALESCE(p.full_name, p.email, 'Cashier'),
        i.total_amount,
        i.status
    FROM invoices i
    JOIN sales s ON s.id = i.sale_id
    JOIN profiles p ON p.id = s.cashier_id
    WHERE i.organization_id = p_organization_id
      AND i.issued_at::DATE BETWEEN p_start_date AND p_end_date
    ORDER BY i.issued_at DESC
    LIMIT p_limit;
END;
$$;

-- Backfill invoices for existing completed sales (idempotent).
INSERT INTO invoices (
    organization_id,
    sale_id,
    invoice_number,
    status,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    notes,
    issued_at
)
SELECT
    s.organization_id,
    s.id,
    generate_invoice_number(s.organization_id),
    'paid',
    s.customer_id,
    c.full_name,
    c.email,
    c.phone,
    s.subtotal,
    s.tax_amount,
    s.discount_amount,
    s.total_amount,
    s.receipt_number,
    s.created_at
FROM sales s
LEFT JOIN customers c ON c.id = s.customer_id
WHERE s.sale_status = 'completed'
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.sale_id = s.id)
ON CONFLICT (sale_id) DO NOTHING;

GRANT EXECUTE ON FUNCTION get_sale_receipt_detail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoices_report(UUID, DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_invoice_for_sale(UUID) TO authenticated;
