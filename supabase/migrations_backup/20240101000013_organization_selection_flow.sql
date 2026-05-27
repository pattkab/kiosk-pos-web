ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS tax_id TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION has_active_organization_membership()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members om
        JOIN profiles p ON p.id = om.profile_id
        JOIN organizations o ON o.id = om.organization_id
        WHERE p.auth_user_id = auth.uid()
          AND om.removed_at IS NULL
          AND o.deleted_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION list_my_organizations()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
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

GRANT EXECUTE ON FUNCTION has_active_organization_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION list_my_organizations() TO authenticated;
