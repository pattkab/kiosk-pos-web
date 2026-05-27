CREATE OR REPLACE FUNCTION create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_currency TEXT DEFAULT 'USD'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_organization_id UUID;
    v_slug TEXT;
    v_currency TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to create an organization.';
    END IF;

    SELECT id INTO v_profile_id
    FROM profiles
    WHERE auth_user_id = auth.uid();

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found for the signed-in user.';
    END IF;

    v_slug := lower(trim(p_slug));
    v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'USD'));

    IF length(trim(p_name)) < 2 THEN
        RAISE EXCEPTION 'Organization name must be at least 2 characters.';
    END IF;

    IF v_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Organization slug can only contain lowercase letters, numbers, and hyphens.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM organizations
        WHERE slug = v_slug
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'This organization slug is already taken.';
    END IF;

    INSERT INTO organizations (name, slug, currency, owner_id)
    VALUES (trim(p_name), v_slug, v_currency, v_profile_id)
    RETURNING id INTO v_organization_id;

    INSERT INTO organization_members (organization_id, profile_id, role)
    VALUES (v_organization_id, v_profile_id, 'owner')
    ON CONFLICT (organization_id, profile_id)
    DO UPDATE SET role = 'owner', removed_at = NULL;

    INSERT INTO settings (organization_id)
    VALUES (v_organization_id)
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO organization_settings (organization_id, low_stock_threshold_default)
    VALUES (v_organization_id, 5)
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO cash_registers (organization_id, name)
    VALUES (v_organization_id, 'Main Register')
    ON CONFLICT DO NOTHING;

    INSERT INTO activity_logs (organization_id, profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_organization_id,
        v_profile_id,
        'CREATE_ORGANIZATION',
        'organization',
        v_organization_id,
        jsonb_build_object('slug', v_slug, 'currency', v_currency)
    );

    RETURN v_organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT, TEXT) TO authenticated;
