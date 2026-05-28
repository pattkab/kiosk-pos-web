-- Fix appearance saves: permission-aware RLS and a definer RPC for reliable updates.

DROP POLICY IF EXISTS "Admins can manage organization settings" ON organization_settings;

CREATE POLICY "Admins can manage organization settings"
    ON organization_settings
    FOR ALL
    USING (has_org_permission(organization_id, 'settings.manage'))
    WITH CHECK (has_org_permission(organization_id, 'settings.manage'));

CREATE OR REPLACE FUNCTION update_organization_appearance(
    p_organization_id UUID,
    p_theme_primary_color TEXT,
    p_theme_accent_color TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_primary TEXT := lower(trim(p_theme_primary_color));
    v_accent TEXT := lower(trim(p_theme_accent_color));
BEGIN
    IF NOT has_org_permission(p_organization_id, 'settings.manage') THEN
        RAISE EXCEPTION 'You do not have permission to update appearance settings.';
    END IF;

    IF v_primary !~ '^#[0-9a-f]{6}$' OR v_accent !~ '^#[0-9a-f]{6}$' THEN
        RAISE EXCEPTION 'Theme colors must be 6-digit hex values (for example, #2563eb).';
    END IF;

    UPDATE organization_settings
    SET
        theme_primary_color = v_primary,
        theme_accent_color = v_accent,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;

    IF NOT FOUND THEN
        INSERT INTO organization_settings (
            organization_id,
            low_stock_threshold_default,
            plan,
            subscription_plan,
            subscription_status,
            billing_cycle,
            theme_primary_color,
            theme_accent_color
        )
        VALUES (
            p_organization_id,
            5,
            'starter',
            'starter',
            'trialing',
            'monthly',
            v_primary,
            v_accent
        );
    END IF;

    PERFORM write_audit_log(
        p_organization_id,
        'UPDATE_APPEARANCE',
        'organization_settings',
        p_organization_id,
        jsonb_build_object(
            'theme_primary_color', v_primary,
            'theme_accent_color', v_accent
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_organization_appearance(UUID, TEXT, TEXT) TO authenticated;
