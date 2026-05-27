-- Ensure the deleted_at column exists
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Ensure helper for RLS exists and filters out deleted orgs
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    AND om.removed_at IS NULL
    AND o.deleted_at IS NULL;
END;
$$;

-- Ensure dependent helper function exists
CREATE OR REPLACE FUNCTION public.org_role(p_organization_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM organization_members
    WHERE organization_id = p_organization_id
    AND profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    AND removed_at IS NULL;
$$;

-- Ensure permission checker exists
CREATE OR REPLACE FUNCTION public.has_org_permission(p_organization_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN org_role(p_organization_id) = 'owner' THEN TRUE
        WHEN org_role(p_organization_id) = 'admin' THEN p_permission <> 'organization.delete'
        WHEN org_role(p_organization_id) = 'manager' THEN p_permission IN (
            'inventory.view','inventory.create','inventory.update','inventory.adjust',
            'pos.access','pos.checkout','reports.view','reports.export','notifications.manage'
        )
        WHEN org_role(p_organization_id) = 'cashier' THEN p_permission IN ('pos.access','pos.checkout')
        ELSE FALSE
    END;
$$;

-- Ensure audit log writer exists
DROP FUNCTION IF EXISTS public.write_audit_log(uuid, text, text, uuid, jsonb) CASCADE;
CREATE OR REPLACE FUNCTION public.write_audit_log(
    p_organization_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.activity_logs (
        organization_id,
        profile_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_organization_id,
        (SELECT id FROM profiles WHERE auth_user_id = auth.uid()),
        p_action,
        p_entity_type,
        p_entity_id,
        p_metadata
    );
END;
$$;

-- Finally, ensure the soft delete function exists
CREATE OR REPLACE FUNCTION public.delete_organization_soft(p_organization_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the current user has permission to delete
    IF NOT has_org_permission(p_organization_id, 'organization.delete') THEN
        RAISE EXCEPTION 'Only owners can delete an organization.';
    END IF;

    -- Soft delete the organization
    UPDATE public.organizations
    SET deleted_at = NOW(),
        slug = slug || '-deleted-' || substr(gen_random_uuid()::TEXT, 1, 8),
        updated_at = NOW()
    WHERE id = p_organization_id;

    -- Log the action
    PERFORM write_audit_log(p_organization_id, 'DELETE_ORGANIZATION', 'organization', p_organization_id, '{}'::JSONB);
END;
$$;

-- Update RLS policies for organizations to filter out deleted ones
DROP POLICY IF EXISTS "Members can view organizations" ON organizations;
CREATE POLICY "Members can view organizations" ON organizations
FOR SELECT USING (id IN (SELECT get_user_organizations()));

DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;
CREATE POLICY "Owners can update organizations" ON organizations
FOR UPDATE USING (
    owner_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    AND deleted_at IS NULL
);
