ALTER TABLE organization_settings
    ADD COLUMN IF NOT EXISTS stock_take_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS stock_take_interval_days INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN IF NOT EXISTS stock_take_last_completed_at TIMESTAMPTZ;

ALTER TABLE organization_settings
    DROP CONSTRAINT IF EXISTS organization_settings_stock_take_interval_days_check;

ALTER TABLE organization_settings
    ADD CONSTRAINT organization_settings_stock_take_interval_days_check
    CHECK (stock_take_interval_days BETWEEN 1 AND 365);

ALTER TABLE notification_preferences
    ALTER COLUMN enabled_alert_types SET DEFAULT ARRAY[
        'low_stock',
        'expiring_soon',
        'expired',
        'failed_sale',
        'register_discrepancy',
        'inventory_adjustment',
        'stock_take',
        'user_activity',
        'daily_summary',
        'system'
    ]::alert_type[];

UPDATE notification_preferences
SET enabled_alert_types = array_append(enabled_alert_types, 'stock_take'::alert_type)
WHERE NOT ('stock_take'::alert_type = ANY(enabled_alert_types));

DROP POLICY IF EXISTS "Members can view role-scoped alerts" ON alerts;
CREATE POLICY "Members can view role-scoped alerts"
    ON alerts FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations())
        AND EXISTS (
            SELECT 1
            FROM organization_members om
            JOIN profiles p ON p.id = om.profile_id
            WHERE p.auth_user_id = auth.uid()
              AND om.organization_id = alerts.organization_id
              AND (
                om.role IN ('owner', 'admin')
                OR (
                    om.role = 'manager'
                    AND alerts.type IN (
                        'low_stock',
                        'expiring_soon',
                        'expired',
                        'inventory_adjustment',
                        'stock_take',
                        'daily_summary',
                        'system',
                        'register_discrepancy',
                        'failed_sale'
                    )
                )
                OR (
                    om.role = 'cashier'
                    AND alerts.type IN (
                        'failed_sale',
                        'register_discrepancy',
                        'user_activity',
                        'system'
                    )
                )
              )
        )
    );

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
            OR (
                om.role = 'manager'
                AND v_alert.type IN (
                    'low_stock',
                    'expiring_soon',
                    'expired',
                    'inventory_adjustment',
                    'stock_take',
                    'daily_summary',
                    'system',
                    'register_discrepancy',
                    'failed_sale'
                )
            )
            OR (
                om.role = 'cashier'
                AND v_alert.type IN (
                    'failed_sale',
                    'register_discrepancy',
                    'user_activity',
                    'system'
                )
            )
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

CREATE OR REPLACE FUNCTION generate_stock_take_reminder(p_organization_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings organization_settings%ROWTYPE;
    v_org_created_at TIMESTAMPTZ;
    v_anchor TIMESTAMPTZ;
    v_due_at TIMESTAMPTZ;
    v_alert_id UUID;
    v_overdue_days INTEGER;
BEGIN
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization is required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM organization_members om
        JOIN profiles p ON p.id = om.profile_id
        WHERE om.organization_id = p_organization_id
          AND p.auth_user_id = auth.uid()
          AND om.removed_at IS NULL
          AND om.role IN ('owner', 'admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'You do not have permission to manage stock take reminders for this organization.';
    END IF;

    SELECT * INTO v_settings
    FROM organization_settings
    WHERE organization_id = p_organization_id;

    IF v_settings.organization_id IS NULL THEN
        INSERT INTO organization_settings (organization_id)
        VALUES (p_organization_id)
        ON CONFLICT (organization_id) DO NOTHING;

        SELECT * INTO v_settings
        FROM organization_settings
        WHERE organization_id = p_organization_id;
    END IF;

    IF COALESCE(v_settings.stock_take_reminders_enabled, TRUE) = FALSE THEN
        UPDATE alerts
        SET status = 'resolved',
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE organization_id = p_organization_id
          AND type = 'stock_take'
          AND status IN ('open', 'acknowledged');
        RETURN NULL;
    END IF;

    SELECT created_at INTO v_org_created_at
    FROM organizations
    WHERE id = p_organization_id;

    v_anchor := COALESCE(v_settings.stock_take_last_completed_at, v_org_created_at, NOW());
    v_due_at := v_anchor + make_interval(days => COALESCE(v_settings.stock_take_interval_days, 7));

    IF v_due_at > NOW() THEN
        UPDATE alerts
        SET status = 'resolved',
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE organization_id = p_organization_id
          AND type = 'stock_take'
          AND status IN ('open', 'acknowledged');
        RETURN NULL;
    END IF;

    v_overdue_days := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - v_due_at)) / 86400)::INTEGER);

    SELECT upsert_operational_alert(
        p_organization_id,
        'stock_take',
        CASE WHEN v_overdue_days >= COALESCE(v_settings.stock_take_interval_days, 7)
            THEN 'high'::alert_priority
            ELSE 'medium'::alert_priority
        END,
        'Stock take due',
        'Count shelf stock and reconcile differences with system inventory.',
        NULL::UUID,
        jsonb_build_object(
            'interval_days',
            COALESCE(v_settings.stock_take_interval_days, 7),
            'last_completed_at',
            v_settings.stock_take_last_completed_at,
            'due_at',
            v_due_at,
            'overdue_days',
            v_overdue_days
        ),
        '/inventory',
        v_due_at
    ) INTO v_alert_id;

    RETURN v_alert_id;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_stock_take_reminder(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION complete_stock_take(p_organization_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_completed_at TIMESTAMPTZ := NOW();
BEGIN
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization is required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM organization_members om
        JOIN profiles p ON p.id = om.profile_id
        WHERE om.organization_id = p_organization_id
          AND p.auth_user_id = auth.uid()
          AND om.removed_at IS NULL
          AND om.role IN ('owner', 'admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'You do not have permission to complete stock takes for this organization.';
    END IF;

    INSERT INTO organization_settings (
        organization_id,
        stock_take_last_completed_at
    )
    VALUES (
        p_organization_id,
        v_completed_at
    )
    ON CONFLICT (organization_id)
    DO UPDATE SET stock_take_last_completed_at = EXCLUDED.stock_take_last_completed_at;

    UPDATE alerts
    SET status = 'resolved',
        resolved_at = v_completed_at,
        updated_at = v_completed_at
    WHERE organization_id = p_organization_id
      AND type = 'stock_take'
      AND status IN ('open', 'acknowledged');

    PERFORM write_audit_log(
        p_organization_id,
        'COMPLETE_STOCK_TAKE',
        'organization_settings',
        p_organization_id,
        jsonb_build_object('completed_at', v_completed_at)
    );

    RETURN v_completed_at;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_stock_take(UUID) TO authenticated;
