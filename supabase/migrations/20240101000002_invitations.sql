CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'cashier',
    invited_by UUID NOT NULL REFERENCES profiles(id),
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(organization_id, email)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins can manage invitations" ON invitations
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
        AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Anyone can view invitation by token" ON invitations
FOR SELECT USING (TRUE);
