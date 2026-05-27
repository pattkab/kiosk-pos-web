-- Fix invite token generation on Postgres instances without gen_random_bytes().
-- We still generate a high-entropy token, but avoid the unavailable function.

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

    -- 64-char token using values available in standard Postgres + Supabase.
    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

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
