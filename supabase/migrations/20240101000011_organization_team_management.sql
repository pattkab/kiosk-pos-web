ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS tax_id TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

ALTER TABLE invitations RENAME TO organization_invitations;

ALTER TABLE organization_invitations
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    permission TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission)
);

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    receipt_header TEXT,
    receipt_footer TEXT,
    low_stock_threshold_default INTEGER NOT NULL DEFAULT 5,
    subscription_plan TEXT NOT NULL DEFAULT 'starter',
    subscription_status TEXT NOT NULL DEFAULT 'trialing',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_members_profile_active
    ON organization_members(profile_id, removed_at, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role_active
    ON organization_members(organization_id, role)
    WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_invitations_token_active
    ON organization_invitations(token)
    WHERE accepted_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created
    ON activity_logs(organization_id, created_at DESC);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'Members can view role permissions') THEN
        CREATE POLICY "Members can view role permissions"
            ON role_permissions FOR SELECT
            USING (TRUE);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_settings' AND policyname = 'Members can view organization settings') THEN
        CREATE POLICY "Members can view organization settings"
            ON organization_settings FOR SELECT
            USING (organization_id IN (SELECT get_user_organizations()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_settings' AND policyname = 'Admins can manage organization settings') THEN
        CREATE POLICY "Admins can manage organization settings"
            ON organization_settings FOR ALL
            USING (
                organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
                    AND role IN ('owner', 'admin')
                    AND removed_at IS NULL
                )
            )
            WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
                    AND role IN ('owner', 'admin')
                    AND removed_at IS NULL
                )
            );
    END IF;
END $$;

DROP POLICY IF EXISTS "Owners and admins can manage invitations" ON organization_invitations;
CREATE POLICY "Owners and admins can manage organization invitations"
ON organization_invitations FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        AND role IN ('owner', 'admin')
        AND removed_at IS NULL
    )
);

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON organization_invitations;
CREATE POLICY "Anyone can view active invitation by token"
ON organization_invitations FOR SELECT USING (
    accepted_at IS NULL
    AND cancelled_at IS NULL
    AND expires_at > NOW()
);

CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM profiles WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.profile_id = current_profile_id()
      AND om.removed_at IS NULL
      AND o.deleted_at IS NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION org_role(p_organization_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM organization_members
    WHERE organization_id = p_organization_id
      AND profile_id = current_profile_id()
      AND removed_at IS NULL
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION has_org_permission(p_organization_id UUID, p_permission TEXT)
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

CREATE OR REPLACE FUNCTION write_audit_log(
    p_organization_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO activity_logs (organization_id, profile_id, action, entity_type, entity_id, metadata)
    VALUES (p_organization_id, current_profile_id(), p_action, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION invite_organization_member(
    p_organization_id UUID,
    p_email TEXT,
    p_role user_role
)
RETURNS TABLE(invitation_id UUID, invitation_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token TEXT;
    v_invitation_id UUID;
BEGIN
    IF NOT has_org_permission(p_organization_id, 'team.manage') THEN
        RAISE EXCEPTION 'You do not have permission to invite team members.';
    END IF;

    IF p_role = 'owner' THEN
        RAISE EXCEPTION 'Owner invitations must be handled by ownership transfer.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM organization_members om
        JOIN profiles p ON p.id = om.profile_id
        WHERE om.organization_id = p_organization_id
          AND lower(p.email) = lower(p_email)
          AND om.removed_at IS NULL
    ) THEN
        RAISE EXCEPTION 'This user is already a member.';
    END IF;

    v_token := encode(gen_random_bytes(32), 'hex');

    INSERT INTO organization_invitations (organization_id, email, role, invited_by, token, expires_at)
    VALUES (p_organization_id, lower(p_email), p_role, current_profile_id(), v_token, NOW() + INTERVAL '7 days')
    ON CONFLICT (organization_id, email)
    DO UPDATE SET
        role = EXCLUDED.role,
        invited_by = EXCLUDED.invited_by,
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        cancelled_at = NULL,
        accepted_at = NULL,
        resent_at = NOW()
    RETURNING id INTO v_invitation_id;

    PERFORM write_audit_log(p_organization_id, 'INVITE_MEMBER', 'organization_invitation', v_invitation_id, jsonb_build_object('email', p_email, 'role', p_role));

    RETURN QUERY SELECT v_invitation_id, '/invite/' || v_token;
END;
$$;

CREATE OR REPLACE FUNCTION accept_organization_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation organization_invitations%ROWTYPE;
    v_profile_id UUID;
BEGIN
    SELECT * INTO v_invitation
    FROM organization_invitations
    WHERE token = p_token
      AND accepted_at IS NULL
      AND cancelled_at IS NULL
      AND expires_at > NOW();

    IF v_invitation.id IS NULL THEN
        RAISE EXCEPTION 'Invitation is invalid or expired.';
    END IF;

    v_profile_id := current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'You must sign in before accepting this invitation.';
    END IF;

    INSERT INTO organization_members (organization_id, profile_id, role, invited_by)
    VALUES (v_invitation.organization_id, v_profile_id, v_invitation.role, v_invitation.invited_by)
    ON CONFLICT (organization_id, profile_id)
    DO UPDATE SET role = EXCLUDED.role, removed_at = NULL;

    UPDATE organization_invitations
    SET accepted_at = NOW()
    WHERE id = v_invitation.id;

    PERFORM write_audit_log(v_invitation.organization_id, 'ACCEPT_INVITATION', 'organization_member', v_profile_id, jsonb_build_object('role', v_invitation.role));

    RETURN v_invitation.organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_member_role(
    p_organization_id UUID,
    p_member_id UUID,
    p_role user_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_role user_role;
BEGIN
    IF NOT has_org_permission(p_organization_id, 'team.manage') THEN
        RAISE EXCEPTION 'You do not have permission to update roles.';
    END IF;

    SELECT role INTO v_existing_role
    FROM organization_members
    WHERE id = p_member_id
      AND organization_id = p_organization_id
      AND removed_at IS NULL;

    IF v_existing_role = 'owner' AND p_role <> 'owner' AND (
        SELECT COUNT(*) FROM organization_members
        WHERE organization_id = p_organization_id AND role = 'owner' AND removed_at IS NULL
    ) <= 1 THEN
        RAISE EXCEPTION 'You cannot remove the last owner.';
    END IF;

    UPDATE organization_members
    SET role = p_role
    WHERE id = p_member_id
      AND organization_id = p_organization_id;

    PERFORM write_audit_log(p_organization_id, 'UPDATE_MEMBER_ROLE', 'organization_member', p_member_id, jsonb_build_object('from', v_existing_role, 'to', p_role));
END;
$$;

CREATE OR REPLACE FUNCTION remove_organization_member(
    p_organization_id UUID,
    p_member_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role user_role;
BEGIN
    IF NOT has_org_permission(p_organization_id, 'team.manage') THEN
        RAISE EXCEPTION 'You do not have permission to remove members.';
    END IF;

    SELECT role INTO v_role FROM organization_members WHERE id = p_member_id AND organization_id = p_organization_id;

    IF v_role = 'owner' AND (
        SELECT COUNT(*) FROM organization_members
        WHERE organization_id = p_organization_id AND role = 'owner' AND removed_at IS NULL
    ) <= 1 THEN
        RAISE EXCEPTION 'You cannot remove the last owner.';
    END IF;

    UPDATE organization_members
    SET removed_at = NOW()
    WHERE id = p_member_id
      AND organization_id = p_organization_id;

    PERFORM write_audit_log(p_organization_id, 'REMOVE_MEMBER', 'organization_member', p_member_id, jsonb_build_object('role', v_role));
END;
$$;

CREATE OR REPLACE FUNCTION delete_organization_soft(p_organization_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT has_org_permission(p_organization_id, 'organization.delete') THEN
        RAISE EXCEPTION 'Only owners can delete an organization.';
    END IF;

    UPDATE organizations
    SET deleted_at = NOW(),
        slug = slug || '-deleted-' || substr(gen_random_uuid()::TEXT, 1, 8),
        updated_at = NOW()
    WHERE id = p_organization_id;

    PERFORM write_audit_log(p_organization_id, 'DELETE_ORGANIZATION', 'organization', p_organization_id, '{}'::JSONB);
END;
$$;

INSERT INTO role_permissions(role, permission)
SELECT role_value::user_role, permission_value
FROM (
    VALUES
    ('owner','organization.manage'), ('owner','organization.delete'), ('owner','team.manage'), ('owner','inventory.view'), ('owner','inventory.create'), ('owner','inventory.update'), ('owner','inventory.delete'), ('owner','inventory.adjust'), ('owner','pos.access'), ('owner','pos.checkout'), ('owner','reports.view'), ('owner','reports.export'), ('owner','notifications.manage'), ('owner','settings.manage'),
    ('admin','organization.manage'), ('admin','team.manage'), ('admin','inventory.view'), ('admin','inventory.create'), ('admin','inventory.update'), ('admin','inventory.delete'), ('admin','inventory.adjust'), ('admin','pos.access'), ('admin','pos.checkout'), ('admin','reports.view'), ('admin','reports.export'), ('admin','notifications.manage'), ('admin','settings.manage'),
    ('manager','inventory.view'), ('manager','inventory.create'), ('manager','inventory.update'), ('manager','inventory.adjust'), ('manager','pos.access'), ('manager','pos.checkout'), ('manager','reports.view'), ('manager','reports.export'), ('manager','notifications.manage'),
    ('cashier','pos.access'), ('cashier','pos.checkout')
) AS values_table(role_value, permission_value)
ON CONFLICT DO NOTHING;

INSERT INTO organization_settings(organization_id, tax_rate, receipt_header, receipt_footer, low_stock_threshold_default)
SELECT id, 0, NULL, NULL, 5
FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
