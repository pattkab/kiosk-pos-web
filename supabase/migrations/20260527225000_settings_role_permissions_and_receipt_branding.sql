-- Add editable role permissions and richer receipt branding fields.

ALTER TABLE organization_settings
    ADD COLUMN IF NOT EXISTS role_permissions JSONB NOT NULL DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS receipt_logo_url TEXT,
    ADD COLUMN IF NOT EXISTS receipt_notes TEXT;

-- Use organization-specific role permission mappings when available.
CREATE OR REPLACE FUNCTION has_org_permission(p_organization_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH role_ctx AS (
        SELECT org_role(p_organization_id) AS role
    ),
    configured_permissions AS (
        SELECT jsonb_array_elements_text(
            COALESCE(os.role_permissions -> (SELECT role::TEXT FROM role_ctx), '[]'::JSONB)
        ) AS permission
        FROM organization_settings os
        WHERE os.organization_id = p_organization_id
    )
    SELECT CASE
        WHEN (SELECT role FROM role_ctx) = 'owner' THEN TRUE
        WHEN EXISTS (SELECT 1 FROM configured_permissions WHERE permission = p_permission) THEN TRUE
        ELSE CASE
            WHEN (SELECT role FROM role_ctx) = 'admin' THEN p_permission <> 'organization.delete'
            WHEN (SELECT role FROM role_ctx) = 'manager' THEN p_permission IN (
                'inventory.view','inventory.create','inventory.update','inventory.adjust',
                'pos.access','pos.checkout','reports.view','reports.export','notifications.manage'
            )
            WHEN (SELECT role FROM role_ctx) = 'cashier' THEN p_permission IN ('pos.access','pos.checkout')
            ELSE FALSE
        END
    END;
$$;
