ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'other';

ALTER TABLE organizations
    DROP CONSTRAINT IF EXISTS organizations_business_type_check;

ALTER TABLE organizations
    ADD CONSTRAINT organizations_business_type_check
    CHECK (
        business_type IN (
            'supermarket_or_shop',
            'pharmacy',
            'salon',
            'restaurant_or_hotel',
            'rental_accommodation',
            'other'
        )
    );

CREATE OR REPLACE FUNCTION create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_currency TEXT DEFAULT 'USD',
    p_business_type TEXT DEFAULT 'other'
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
    v_business_type TEXT;
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
    v_business_type := lower(coalesce(nullif(trim(p_business_type), ''), 'other'));

    IF length(trim(p_name)) < 2 THEN
        RAISE EXCEPTION 'Organization name must be at least 2 characters.';
    END IF;

    IF v_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Organization slug can only contain lowercase letters, numbers, and hyphens.';
    END IF;

    IF v_business_type NOT IN (
        'supermarket_or_shop',
        'pharmacy',
        'salon',
        'restaurant_or_hotel',
        'rental_accommodation',
        'other'
    ) THEN
        RAISE EXCEPTION 'Unsupported business type.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM organizations
        WHERE slug = v_slug
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'This organization slug is already taken.';
    END IF;

    INSERT INTO organizations (name, slug, currency, business_type, owner_id)
    VALUES (trim(p_name), v_slug, v_currency, v_business_type, v_profile_id)
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
        jsonb_build_object('slug', v_slug, 'currency', v_currency, 'business_type', v_business_type)
    );

    RETURN v_organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS list_my_organizations();

CREATE OR REPLACE FUNCTION list_my_organizations()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    business_type TEXT,
    logo_url TEXT,
    currency TEXT,
    timezone TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    tax_id TEXT,
    role user_role,
    member_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        o.id,
        o.name,
        o.slug,
        o.business_type,
        o.logo_url,
        o.currency,
        o.timezone,
        o.address,
        o.phone,
        o.email,
        o.tax_id,
        om.role,
        om.id AS member_id
    FROM organization_members om
    JOIN profiles p ON p.id = om.profile_id
    JOIN organizations o ON o.id = om.organization_id
    WHERE p.auth_user_id = auth.uid()
      AND om.removed_at IS NULL
      AND o.deleted_at IS NULL
    ORDER BY om.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION list_my_organizations() TO authenticated;
