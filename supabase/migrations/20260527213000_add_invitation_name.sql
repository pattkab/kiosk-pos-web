-- Allow capturing invitee name when creating organization invitations.

ALTER TABLE organization_invitations
    ADD COLUMN IF NOT EXISTS name TEXT;

CREATE OR REPLACE FUNCTION invite_organization_member(
    p_organization_id UUID,
    p_name TEXT,
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

    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO organization_invitations (organization_id, name, email, role, invited_by, token, expires_at)
    VALUES (p_organization_id, nullif(trim(p_name), ''), lower(p_email), p_role, current_profile_id(), v_token, NOW() + INTERVAL '7 days')
    ON CONFLICT (organization_id, email)
    DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        invited_by = EXCLUDED.invited_by,
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        cancelled_at = NULL,
        accepted_at = NULL,
        resent_at = NOW()
    RETURNING id INTO v_invitation_id;

    PERFORM write_audit_log(
        p_organization_id,
        'INVITE_MEMBER',
        'organization_invitation',
        v_invitation_id,
        jsonb_build_object('name', p_name, 'email', p_email, 'role', p_role)
    );

    RETURN QUERY SELECT v_invitation_id, '/invite/' || v_token;
END;
$$;

-- Backward-compatible wrapper for old clients still sending 3 args.
CREATE OR REPLACE FUNCTION invite_organization_member(
    p_organization_id UUID,
    p_email TEXT,
    p_role user_role
)
RETURNS TABLE(invitation_id UUID, invitation_url TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM invite_organization_member(p_organization_id, NULL::TEXT, p_email, p_role);
$$;
