-- Customer loyalty cards, invitations, and scan-at-checkout lookup.

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS loyalty_card_number TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS customers_status_check;

ALTER TABLE customers
    ADD CONSTRAINT customers_status_check
    CHECK (status IN ('active', 'inactive'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_org_loyalty_card
    ON customers(organization_id, loyalty_card_number)
    WHERE loyalty_card_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_org_profile
    ON customers(organization_id, profile_id)
    WHERE profile_id IS NOT NULL;

CREATE OR REPLACE FUNCTION generate_customer_invite_token()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
    SELECT replace(gen_random_uuid()::text, '-', '')
        || replace(gen_random_uuid()::text, '-', '');
$$;

CREATE TABLE IF NOT EXISTS customer_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    full_name TEXT,
    invited_by UUID NOT NULL REFERENCES profiles(id),
    token TEXT UNIQUE NOT NULL DEFAULT generate_customer_invite_token(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    accepted_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT customer_invitations_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_customer_invitations_org_active
    ON customer_invitations(organization_id, created_at DESC)
    WHERE accepted_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE customer_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'customer_invitations'
          AND policyname = 'Managers can manage customer invitations'
    ) THEN
        CREATE POLICY "Managers can manage customer invitations"
            ON customer_invitations FOR ALL
            USING (
                organization_id IN (
                    SELECT organization_id
                    FROM organization_members
                    WHERE profile_id = current_profile_id()
                      AND role IN ('owner', 'admin', 'manager')
                      AND removed_at IS NULL
                )
            )
            WITH CHECK (
                organization_id IN (
                    SELECT organization_id
                    FROM organization_members
                    WHERE profile_id = current_profile_id()
                      AND role IN ('owner', 'admin', 'manager')
                      AND removed_at IS NULL
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'customer_invitations'
          AND policyname = 'Anyone can view active customer invitation by token'
    ) THEN
        CREATE POLICY "Anyone can view active customer invitation by token"
            ON customer_invitations FOR SELECT
            USING (
                accepted_at IS NULL
                AND cancelled_at IS NULL
                AND expires_at > NOW()
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'customers'
          AND policyname = 'Customers can view their own loyalty profile'
    ) THEN
        CREATE POLICY "Customers can view their own loyalty profile"
            ON customers FOR SELECT
            USING (
                profile_id = current_profile_id()
            );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_loyalty_card_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_chars CONSTANT TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    v_result TEXT := 'KPOS';
    i INT;
    v_candidate TEXT;
BEGIN
    LOOP
        v_candidate := v_result;
        FOR i IN 1..10 LOOP
            v_candidate := v_candidate || substr(
                v_chars,
                floor(random() * length(v_chars) + 1)::INT,
                1
            );
        END LOOP;

        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM customers WHERE loyalty_card_number = v_candidate
        );
    END LOOP;

    RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION customers_set_loyalty_card()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.loyalty_card_number IS NULL OR btrim(NEW.loyalty_card_number) = '' THEN
        NEW.loyalty_card_number := generate_loyalty_card_number();
    ELSE
        NEW.loyalty_card_number := upper(regexp_replace(NEW.loyalty_card_number, '[^A-Z0-9]', '', 'g'));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_loyalty_card_before_insert ON customers;
CREATE TRIGGER customers_loyalty_card_before_insert
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE PROCEDURE customers_set_loyalty_card();

UPDATE customers
SET loyalty_card_number = generate_loyalty_card_number()
WHERE loyalty_card_number IS NULL OR btrim(loyalty_card_number) = '';

ALTER TABLE customers
    ALTER COLUMN loyalty_card_number SET NOT NULL;

CREATE OR REPLACE FUNCTION normalize_loyalty_card_number(p_code TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT upper(regexp_replace(coalesce(p_code, ''), '[^A-Z0-9]', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION sync_customers_for_profile(p_profile_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_invitation RECORD;
    v_customer_id UUID;
    v_synced INTEGER := 0;
BEGIN
    SELECT id, lower(email) AS email, phone, full_name
    INTO v_profile
    FROM profiles
    WHERE id = p_profile_id;

    IF v_profile.id IS NULL THEN
        RETURN 0;
    END IF;

    FOR v_invitation IN
        SELECT *
        FROM customer_invitations ci
        WHERE ci.accepted_at IS NULL
          AND ci.cancelled_at IS NULL
          AND ci.expires_at > NOW()
          AND (
            (ci.email IS NOT NULL AND lower(ci.email) = v_profile.email)
            OR (
                ci.phone IS NOT NULL
                AND v_profile.phone IS NOT NULL
                AND regexp_replace(ci.phone, '\D', '', 'g') =
                    regexp_replace(v_profile.phone, '\D', '', 'g')
            )
          )
    LOOP
        SELECT c.id
        INTO v_customer_id
        FROM customers c
        WHERE c.organization_id = v_invitation.organization_id
          AND (
            (v_invitation.email IS NOT NULL AND lower(c.email) = lower(v_invitation.email))
            OR (
                v_invitation.phone IS NOT NULL
                AND c.phone IS NOT NULL
                AND regexp_replace(c.phone, '\D', '', 'g') =
                    regexp_replace(v_invitation.phone, '\D', '', 'g')
            )
            OR c.profile_id = p_profile_id
          )
        LIMIT 1;

        IF v_customer_id IS NULL THEN
            INSERT INTO customers (
                organization_id,
                profile_id,
                full_name,
                email,
                phone,
                status
            ) VALUES (
                v_invitation.organization_id,
                p_profile_id,
                coalesce(nullif(btrim(v_invitation.full_name), ''), v_profile.full_name, v_invitation.email, 'Customer'),
                lower(v_invitation.email),
                v_invitation.phone,
                'active'
            )
            RETURNING id INTO v_customer_id;
        ELSE
            UPDATE customers
            SET
                profile_id = p_profile_id,
                full_name = coalesce(nullif(btrim(v_invitation.full_name), ''), customers.full_name, v_profile.full_name),
                email = coalesce(customers.email, lower(v_invitation.email)),
                phone = coalesce(customers.phone, v_invitation.phone),
                updated_at = NOW()
            WHERE id = v_customer_id;
        END IF;

        UPDATE customer_invitations
        SET accepted_at = NOW()
        WHERE id = v_invitation.id;

        v_synced := v_synced + 1;
    END LOOP;

    RETURN v_synced;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_profile_for_current_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_email TEXT;
  v_full_name TEXT;
  v_profile_id UUID;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in.';
  END IF;

  SELECT
    lower(u.email),
    nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), '')
  INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = v_auth_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Signed-in user email was not found.';
  END IF;

  SELECT p.id
  INTO v_profile_id
  FROM profiles p
  WHERE lower(p.email) = v_email
  ORDER BY
    CASE WHEN p.auth_user_id = v_auth_user_id THEN 0 ELSE 1 END,
    p.created_at ASC NULLS FIRST
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (auth_user_id, email, full_name, theme_preference)
    VALUES (v_auth_user_id, v_email, v_full_name, 'system')
    RETURNING id INTO v_profile_id;
  ELSIF EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = v_profile_id
      AND p.auth_user_id <> v_auth_user_id
  ) THEN
    DELETE FROM profiles p
    WHERE p.auth_user_id = v_auth_user_id
      AND p.id <> v_profile_id;

    UPDATE profiles
    SET
      auth_user_id = v_auth_user_id,
      email = v_email,
      full_name = COALESCE(profiles.full_name, v_full_name)
    WHERE id = v_profile_id;
  END IF;

  PERFORM sync_customers_for_profile(v_profile_id);

  RETURN v_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION has_customer_membership()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM customers c
        WHERE c.profile_id = current_profile_id()
          AND c.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION list_my_customer_memberships()
RETURNS TABLE (
    customer_id UUID,
    organization_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    full_name TEXT,
    loyalty_points INTEGER,
    loyalty_card_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.id,
        c.organization_id,
        o.name,
        o.slug,
        c.full_name,
        c.loyalty_points,
        c.loyalty_card_number
    FROM customers c
    JOIN organizations o ON o.id = c.organization_id
    WHERE c.profile_id = current_profile_id()
      AND c.status = 'active'
      AND o.deleted_at IS NULL
    ORDER BY o.name ASC;
$$;

CREATE OR REPLACE FUNCTION invite_customer(
    p_organization_id UUID,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    invitation_id UUID,
    token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID := current_profile_id();
    v_email TEXT := nullif(lower(btrim(p_email)), '');
    v_phone TEXT := nullif(btrim(p_phone), '');
    v_name TEXT := nullif(btrim(p_full_name), '');
    v_token TEXT := generate_customer_invite_token();
    v_id UUID;
BEGIN
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'You must be signed in.';
    END IF;

    IF v_email IS NULL AND v_phone IS NULL THEN
        RAISE EXCEPTION 'Email or phone is required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM organization_members om
        WHERE om.organization_id = p_organization_id
          AND om.profile_id = v_profile_id
          AND om.role IN ('owner', 'admin', 'manager')
          AND om.removed_at IS NULL
    ) THEN
        RAISE EXCEPTION 'You do not have permission to invite customers.';
    END IF;

    INSERT INTO customer_invitations (
        organization_id,
        email,
        phone,
        full_name,
        invited_by,
        token
    ) VALUES (
        p_organization_id,
        v_email,
        v_phone,
        v_name,
        v_profile_id,
        v_token
    )
    RETURNING id INTO v_id;

    RETURN QUERY SELECT v_id, v_token;
END;
$$;

CREATE OR REPLACE FUNCTION accept_customer_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID := current_profile_id();
    v_invitation customer_invitations%ROWTYPE;
    v_customer_id UUID;
BEGIN
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'You must be signed in.';
    END IF;

    SELECT *
    INTO v_invitation
    FROM customer_invitations
    WHERE token = p_token
      AND accepted_at IS NULL
      AND cancelled_at IS NULL
      AND expires_at > NOW()
    FOR UPDATE;

    IF v_invitation.id IS NULL THEN
        RAISE EXCEPTION 'Invitation is invalid or expired.';
    END IF;

    PERFORM sync_customers_for_profile(v_profile_id);

    SELECT c.id
    INTO v_customer_id
    FROM customers c
    WHERE c.organization_id = v_invitation.organization_id
      AND c.profile_id = v_profile_id
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Customer profile could not be linked.';
    END IF;

    RETURN v_customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION lookup_loyalty_customer(
    p_organization_id UUID,
    p_loyalty_card_number TEXT
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    loyalty_points INTEGER,
    loyalty_card_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_card TEXT := normalize_loyalty_card_number(p_loyalty_card_number);
BEGIN
    IF v_card IS NULL OR length(v_card) < 8 THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM organization_members om
        WHERE om.organization_id = p_organization_id
          AND om.profile_id = current_profile_id()
          AND om.removed_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Unauthorized.';
    END IF;

    RETURN QUERY
    SELECT
        c.id,
        c.full_name,
        c.email,
        c.phone,
        c.loyalty_points,
        c.loyalty_card_number
    FROM customers c
    WHERE c.organization_id = p_organization_id
      AND c.status = 'active'
      AND c.loyalty_card_number = v_card
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_customers_for_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_customer_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION list_my_customer_memberships() TO authenticated;
GRANT EXECUTE ON FUNCTION invite_customer(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_customer_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION lookup_loyalty_customer(UUID, TEXT) TO authenticated;
