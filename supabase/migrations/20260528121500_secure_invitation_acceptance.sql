-- Require invitation acceptance by the invited email address.

CREATE OR REPLACE FUNCTION accept_organization_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation organization_invitations%ROWTYPE;
    v_profile_id UUID;
    v_profile_email TEXT;
BEGIN
    SELECT *
    INTO v_invitation
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

    SELECT lower(email)
    INTO v_profile_email
    FROM profiles
    WHERE id = v_profile_id;

    IF v_profile_email IS NULL OR v_profile_email <> lower(v_invitation.email) THEN
        RAISE EXCEPTION 'You must sign in with the invited email address to accept this invitation.';
    END IF;

    INSERT INTO organization_members (organization_id, profile_id, role, invited_by)
    VALUES (v_invitation.organization_id, v_profile_id, v_invitation.role, v_invitation.invited_by)
    ON CONFLICT (organization_id, profile_id)
    DO UPDATE SET role = EXCLUDED.role, removed_at = NULL;

    UPDATE organization_invitations
    SET accepted_at = NOW()
    WHERE id = v_invitation.id;

    PERFORM write_audit_log(
        v_invitation.organization_id,
        'ACCEPT_INVITATION',
        'organization_member',
        v_profile_id,
        jsonb_build_object('role', v_invitation.role, 'email', v_profile_email)
    );

    RETURN v_invitation.organization_id;
END;
$$;
