-- Operational notifications and alert center.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_priority') THEN
        CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
        CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'archived');
    END IF;
END $$;

ALTER TABLE alerts
    ADD COLUMN IF NOT EXISTS priority alert_priority NOT NULL DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS status alert_status NOT NULL DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    priority alert_priority NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority alert_priority NOT NULL DEFAULT 'medium',
    threshold_days INTEGER,
    threshold_quantity INTEGER,
    applies_to_roles user_role[] NOT NULL DEFAULT ARRAY['owner','admin','manager']::user_role[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, type)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enabled_alert_types alert_type[] NOT NULL DEFAULT ARRAY[
        'low_stock',
        'expiring_soon',
        'expired',
        'failed_sale',
        'register_discrepancy',
        'inventory_adjustment',
        'user_activity',
        'daily_summary',
        'system'
    ]::alert_type[],
    minimum_priority alert_priority NOT NULL DEFAULT 'low',
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    daily_summary_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_org_status_priority
    ON alerts(organization_id, status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_org_type_resource_open
    ON alerts(organization_id, type, resource_id)
    WHERE status IN ('open', 'acknowledged');
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications(recipient_id, read_at, created_at DESC)
    WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_org_type_created
    ON notifications(organization_id, type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_alert_recipient_unique
    ON notifications(alert_id, recipient_id)
    WHERE alert_id IS NOT NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view assigned notifications') THEN
        CREATE POLICY "Users can view assigned notifications"
            ON notifications FOR SELECT
            USING (
                organization_id IN (SELECT get_user_organizations())
                AND (
                    recipient_id IS NULL
                    OR recipient_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update assigned notifications') THEN
        CREATE POLICY "Users can update assigned notifications"
            ON notifications FOR UPDATE
            USING (
                organization_id IN (SELECT get_user_organizations())
                AND (
                    recipient_id IS NULL
                    OR recipient_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alert_rules' AND policyname = 'Managers can manage alert rules') THEN
        CREATE POLICY "Managers can manage alert rules"
            ON alert_rules FOR ALL
            USING (
                organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
                    AND role IN ('owner', 'admin', 'manager')
                )
            )
            WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
                    AND role IN ('owner', 'admin', 'manager')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can manage own notification preferences') THEN
        CREATE POLICY "Users can manage own notification preferences"
            ON notification_preferences FOR ALL
            USING (
                organization_id IN (SELECT get_user_organizations())
                AND profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
            )
            WITH CHECK (
                organization_id IN (SELECT get_user_organizations())
                AND profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
            );
    END IF;
END $$;

DROP POLICY IF EXISTS "Members can view alerts" ON alerts;
CREATE POLICY "Members can view role-scoped alerts"
    ON alerts FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations())
        AND (
            EXISTS (
                SELECT 1
                FROM organization_members om
                JOIN profiles p ON p.id = om.profile_id
                WHERE p.auth_user_id = auth.uid()
                  AND om.organization_id = alerts.organization_id
                  AND (
                    om.role IN ('owner', 'admin')
                    OR (om.role = 'manager' AND alerts.type IN ('low_stock','expiring_soon','expired','inventory_adjustment','daily_summary','system','register_discrepancy','failed_sale'))
                    OR (om.role = 'cashier' AND alerts.type IN ('failed_sale','register_discrepancy','user_activity','system'))
                  )
            )
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Members can update readable alerts') THEN
        CREATE POLICY "Members can update readable alerts"
            ON alerts FOR UPDATE
            USING (organization_id IN (SELECT get_user_organizations()));
    END IF;
END $$;

CREATE OR REPLACE FUNCTION priority_rank(p_priority alert_priority)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_priority
        WHEN 'low' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'high' THEN 3
        WHEN 'critical' THEN 4
    END;
$$;

CREATE OR REPLACE FUNCTION fanout_alert_notifications(p_alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_operational_alert(
    p_organization_id UUID,
    p_type alert_type,
    p_priority alert_priority,
    p_title TEXT,
    p_message TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_action_url TEXT DEFAULT NULL,
    p_due_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    SELECT id INTO v_alert_id
    FROM alerts
    WHERE organization_id = p_organization_id
      AND type = p_type
      AND COALESCE(resource_id, '00000000-0000-0000-0000-000000000000'::UUID) = COALESCE(p_resource_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND status IN ('open', 'acknowledged')
    LIMIT 1;

    IF v_alert_id IS NULL THEN
        INSERT INTO alerts (
            organization_id, type, priority, title, message, resource_id, metadata, action_url, due_at
        ) VALUES (
            p_organization_id, p_type, p_priority, p_title, p_message, p_resource_id, p_metadata, p_action_url, p_due_at
        )
        RETURNING id INTO v_alert_id;
    ELSE
        UPDATE alerts
        SET priority = p_priority,
            title = p_title,
            message = p_message,
            metadata = p_metadata,
            action_url = p_action_url,
            due_at = p_due_at,
            status = 'open',
            resolved_at = NULL,
            archived_at = NULL,
            updated_at = NOW()
        WHERE id = v_alert_id;
    END IF;

    PERFORM fanout_alert_notifications(v_alert_id);
    RETURN v_alert_id;
END;
$$;

CREATE OR REPLACE FUNCTION fanout_alert_notifications(p_alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_alert alerts%ROWTYPE;
    v_member RECORD;
    v_pref RECORD;
BEGIN
    SELECT * INTO v_alert FROM alerts WHERE id = p_alert_id;
    IF v_alert.id IS NULL THEN
        RETURN;
    END IF;

    FOR v_member IN
        SELECT om.profile_id, om.role
        FROM organization_members om
        WHERE om.organization_id = v_alert.organization_id
          AND (
            om.role IN ('owner', 'admin')
            OR (om.role = 'manager' AND v_alert.type IN ('low_stock','expiring_soon','expired','inventory_adjustment','daily_summary','system','register_discrepancy','failed_sale'))
            OR (om.role = 'cashier' AND v_alert.type IN ('failed_sale','register_discrepancy','user_activity','system'))
          )
    LOOP
        SELECT * INTO v_pref
        FROM notification_preferences
        WHERE organization_id = v_alert.organization_id
          AND profile_id = v_member.profile_id;

        IF v_pref.id IS NULL
            OR (
                v_pref.in_app_enabled
                AND v_alert.type = ANY(v_pref.enabled_alert_types)
                AND priority_rank(v_alert.priority) >= priority_rank(v_pref.minimum_priority)
            )
        THEN
            INSERT INTO notifications (
                organization_id,
                alert_id,
                recipient_id,
                type,
                priority,
                title,
                message,
                action_url,
                metadata
            ) VALUES (
                v_alert.organization_id,
                v_alert.id,
                v_member.profile_id,
                v_alert.type,
                v_alert.priority,
                v_alert.title,
                v_alert.message,
                v_alert.action_url,
                v_alert.metadata
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION resolve_alert_for_resource(
    p_organization_id UUID,
    p_type alert_type,
    p_resource_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE alerts
    SET status = 'resolved',
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE organization_id = p_organization_id
      AND type = p_type
      AND resource_id = p_resource_id
      AND status IN ('open', 'acknowledged');
END;
$$;

CREATE OR REPLACE FUNCTION manage_stock_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_priority alert_priority;
    v_type alert_type := 'low_stock';
BEGIN
    IF NEW.stock_quantity <= 0 THEN
        v_priority := 'critical';
    ELSIF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        v_priority := 'high';
    ELSE
        PERFORM resolve_alert_for_resource(NEW.organization_id, 'low_stock', NEW.id);
        RETURN NEW;
    END IF;

    PERFORM upsert_operational_alert(
        NEW.organization_id,
        v_type,
        v_priority,
        CASE WHEN NEW.stock_quantity <= 0 THEN 'Product out of stock' ELSE 'Low stock product' END,
        NEW.name || ' has ' || NEW.stock_quantity || ' units remaining.',
        NEW.id,
        jsonb_build_object('stock_quantity', NEW.stock_quantity, 'threshold', NEW.low_stock_threshold),
        '/inventory',
        NOW()
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_product_stock_update ON products;
CREATE TRIGGER on_product_stock_update
AFTER INSERT OR UPDATE OF stock_quantity, low_stock_threshold ON products
FOR EACH ROW EXECUTE PROCEDURE manage_stock_alerts();

CREATE OR REPLACE FUNCTION manage_inventory_adjustment_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product_name TEXT;
BEGIN
    IF NEW.transaction_type <> 'adjustment' THEN
        RETURN NEW;
    END IF;

    SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;

    PERFORM upsert_operational_alert(
        NEW.organization_id,
        'inventory_adjustment',
        CASE WHEN ABS(NEW.quantity_change) >= 20 THEN 'high'::alert_priority ELSE 'medium'::alert_priority END,
        'Inventory adjustment recorded',
        COALESCE(v_product_name, 'Product') || ' was adjusted by ' || NEW.quantity_change || ' units.',
        NEW.product_id,
        jsonb_build_object('quantity_change', NEW.quantity_change, 'transaction_id', NEW.id),
        '/inventory',
        NOW()
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_inventory_adjustment_alert ON inventory_transactions;
CREATE TRIGGER on_inventory_adjustment_alert
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE PROCEDURE manage_inventory_adjustment_alerts();

CREATE OR REPLACE FUNCTION manage_register_discrepancy_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.closed_at IS NOT NULL AND COALESCE(NEW.discrepancy, 0) <> 0 THEN
        PERFORM upsert_operational_alert(
            NEW.organization_id,
            'register_discrepancy',
            CASE WHEN ABS(NEW.discrepancy) >= 50 THEN 'critical'::alert_priority ELSE 'high'::alert_priority END,
            'Register cash discrepancy',
            'Register session closed with a variance of ' || NEW.discrepancy || '.',
            NEW.id,
            jsonb_build_object('discrepancy', NEW.discrepancy, 'register_id', NEW.register_id),
            '/reports/registers',
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_register_discrepancy_alert ON register_sessions;
CREATE TRIGGER on_register_discrepancy_alert
AFTER UPDATE OF closed_at, discrepancy ON register_sessions
FOR EACH ROW EXECUTE PROCEDURE manage_register_discrepancy_alerts();

CREATE OR REPLACE FUNCTION generate_expiry_alerts(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product RECORD;
    v_count INTEGER := 0;
    v_type alert_type;
    v_priority alert_priority;
    v_days INTEGER;
BEGIN
    FOR v_product IN
        SELECT id, name, organization_id, expiry_date, stock_quantity
        FROM products
        WHERE organization_id = p_organization_id
          AND is_active = TRUE
          AND expiry_date IS NOT NULL
          AND stock_quantity > 0
          AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    LOOP
        v_days := v_product.expiry_date - CURRENT_DATE;

        IF v_days < 0 THEN
            v_type := 'expired';
            v_priority := 'critical';
        ELSIF v_days <= 7 THEN
            v_type := 'expiring_soon';
            v_priority := 'high';
        ELSE
            v_type := 'expiring_soon';
            v_priority := 'medium';
        END IF;

        PERFORM upsert_operational_alert(
            v_product.organization_id,
            v_type,
            v_priority,
            CASE WHEN v_type = 'expired' THEN 'Product expired' ELSE 'Product expiring soon' END,
            v_product.name || CASE WHEN v_days < 0 THEN ' expired ' || ABS(v_days) || ' days ago.' ELSE ' expires in ' || v_days || ' days.' END,
            v_product.id,
            jsonb_build_object('expiry_date', v_product.expiry_date, 'days_until_expiry', v_days),
            '/inventory',
            v_product.expiry_date::TIMESTAMPTZ
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION generate_daily_summary_alert(p_organization_id UUID, p_summary_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_revenue DECIMAL(12,2);
    v_sales BIGINT;
    v_top_product TEXT;
    v_low_stock BIGINT;
    v_expiring BIGINT;
    v_discrepancies BIGINT;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0), COUNT(*)
    INTO v_revenue, v_sales
    FROM sales
    WHERE organization_id = p_organization_id
      AND sale_status = 'completed'
      AND created_at::DATE = p_summary_date;

    SELECT si.product_name_snapshot
    INTO v_top_product
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.organization_id = p_organization_id
      AND s.sale_status = 'completed'
      AND s.created_at::DATE = p_summary_date
    GROUP BY si.product_name_snapshot
    ORDER BY SUM(si.quantity) DESC
    LIMIT 1;

    SELECT COUNT(*) FILTER (WHERE stock_quantity <= low_stock_threshold),
           COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
    INTO v_low_stock, v_expiring
    FROM products
    WHERE organization_id = p_organization_id
      AND is_active = TRUE;

    SELECT COUNT(*)
    INTO v_discrepancies
    FROM register_sessions
    WHERE organization_id = p_organization_id
      AND closed_at::DATE = p_summary_date
      AND COALESCE(discrepancy, 0) <> 0;

    RETURN upsert_operational_alert(
        p_organization_id,
        'daily_summary',
        'low',
        'Daily operating summary',
        v_sales || ' sales, revenue ' || v_revenue || ', top product ' || COALESCE(v_top_product, 'none') || '.',
        NULL,
        jsonb_build_object(
            'summary_date', p_summary_date,
            'sales', v_sales,
            'revenue', v_revenue,
            'top_product', v_top_product,
            'low_stock_count', v_low_stock,
            'expiring_products_count', v_expiring,
            'register_discrepancies', v_discrepancies
        ),
        '/reports',
        p_summary_date::TIMESTAMPTZ
    );
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

ALTER TABLE notifications REPLICA IDENTITY FULL;
