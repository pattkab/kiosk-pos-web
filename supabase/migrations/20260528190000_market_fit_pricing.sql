-- Market-fit pricing for Africa and Asia SMB adoption.
-- Keeps legacy subscription_plan for compatibility, while introducing plan,
-- billing_cycle, and server-side limits for the new Starter/Growth/Business/Enterprise model.

ALTER TABLE organization_settings
    ADD COLUMN IF NOT EXISTS plan TEXT,
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS current_period_ends_at TIMESTAMPTZ;

UPDATE organization_settings
SET
    plan = CASE
        WHEN COALESCE(plan, subscription_plan) = 'pro' THEN 'business'
        WHEN COALESCE(plan, subscription_plan) IN ('starter', 'growth', 'business', 'enterprise')
            THEN COALESCE(plan, subscription_plan)
        ELSE 'starter'
    END,
    subscription_plan = CASE
        WHEN subscription_plan = 'pro' THEN 'business'
        WHEN subscription_plan IN ('starter', 'growth', 'business', 'enterprise') THEN subscription_plan
        ELSE 'starter'
    END,
    subscription_status = CASE
        WHEN subscription_status IN ('free', 'trialing', 'active', 'past_due', 'cancelled') THEN subscription_status
        WHEN subscription_status IN ('inactive', 'canceled', 'unpaid') THEN 'cancelled'
        WHEN stripe_subscription_id IS NULL THEN 'free'
        ELSE 'active'
    END,
    billing_cycle = CASE
        WHEN billing_cycle IN ('monthly', 'yearly') THEN billing_cycle
        ELSE 'monthly'
    END,
    trial_ends_at = CASE
        WHEN stripe_subscription_id IS NULL AND subscription_status = 'trialing' THEN NULL
        ELSE trial_ends_at
    END;

ALTER TABLE organization_settings
    ALTER COLUMN plan SET NOT NULL,
    ALTER COLUMN plan SET DEFAULT 'starter',
    ALTER COLUMN subscription_plan SET DEFAULT 'starter',
    ALTER COLUMN subscription_status SET DEFAULT 'free';

ALTER TABLE organization_settings
    DROP CONSTRAINT IF EXISTS organization_settings_plan_check,
    DROP CONSTRAINT IF EXISTS organization_settings_subscription_plan_check,
    DROP CONSTRAINT IF EXISTS organization_settings_subscription_status_check,
    DROP CONSTRAINT IF EXISTS organization_settings_billing_cycle_check;

ALTER TABLE organization_settings
    ADD CONSTRAINT organization_settings_plan_check
    CHECK (plan IN ('starter', 'growth', 'business', 'enterprise')),
    ADD CONSTRAINT organization_settings_subscription_plan_check
    CHECK (subscription_plan IN ('starter', 'growth', 'business', 'enterprise')),
    ADD CONSTRAINT organization_settings_subscription_status_check
    CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'cancelled')),
    ADD CONSTRAINT organization_settings_billing_cycle_check
    CHECK (billing_cycle IN ('monthly', 'yearly'));

CREATE OR REPLACE FUNCTION normalize_subscription_plan(p_plan TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_plan
        WHEN 'enterprise' THEN 'enterprise'
        WHEN 'business' THEN 'business'
        WHEN 'pro' THEN 'business'
        WHEN 'growth' THEN 'growth'
        ELSE 'starter'
    END;
$$;

CREATE OR REPLACE FUNCTION subscription_plan_rank(p_plan TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE normalize_subscription_plan(p_plan)
        WHEN 'enterprise' THEN 3
        WHEN 'business' THEN 2
        WHEN 'growth' THEN 1
        ELSE 0
    END;
$$;

CREATE OR REPLACE FUNCTION subscription_required_plan_for_feature(p_feature TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_feature
        WHEN 'barcodeScanning' THEN 'growth'
        WHEN 'customerAccounts' THEN 'growth'
        WHEN 'loyaltyHistory' THEN 'growth'
        WHEN 'returnsRefunds' THEN 'growth'
        WHEN 'discounts' THEN 'growth'
        WHEN 'expenseTracking' THEN 'growth'
        WHEN 'supplierManagementBasic' THEN 'growth'
        WHEN 'purchaseRecords' THEN 'growth'
        WHEN 'reports' THEN 'growth'
        WHEN 'standardReports' THEN 'growth'
        WHEN 'exportReports' THEN 'growth'
        WHEN 'team' THEN 'growth'
        WHEN 'staffPermissionsBasic' THEN 'growth'
        WHEN 'offlineSync' THEN 'growth'
        WHEN 'notifications' THEN 'growth'
        WHEN 'whatsAppReceipts' THEN 'growth'
        WHEN 'inventoryAdjustments' THEN 'growth'
        WHEN 'stockMovementTracking' THEN 'growth'
        WHEN 'multiBranchInventory' THEN 'business'
        WHEN 'advancedReporting' THEN 'business'
        WHEN 'auditLogs' THEN 'business'
        WHEN 'advancedPermissions' THEN 'business'
        WHEN 'roleBasedPermissions' THEN 'business'
        WHEN 'purchaseOrders' THEN 'business'
        WHEN 'supplierManagementAdvanced' THEN 'business'
        WHEN 'pharmacyExpiryTracking' THEN 'business'
        WHEN 'restaurantTables' THEN 'business'
        WHEN 'kitchenOrderTickets' THEN 'business'
        WHEN 'branchAnalytics' THEN 'business'
        WHEN 'inventoryTransfers' THEN 'business'
        WHEN 'stockValuation' THEN 'business'
        WHEN 'advancedPromotions' THEN 'business'
        WHEN 'approvalWorkflows' THEN 'business'
        WHEN 'organizationManagement' THEN 'business'
        WHEN 'advancedBranding' THEN 'business'
        WHEN 'apiAccess' THEN 'enterprise'
        WHEN 'whiteLabeling' THEN 'enterprise'
        WHEN 'dedicatedOnboarding' THEN 'enterprise'
        WHEN 'prioritySupport' THEN 'enterprise'
        WHEN 'slaSupport' THEN 'enterprise'
        WHEN 'customIntegrations' THEN 'enterprise'
        WHEN 'advancedAnalytics' THEN 'enterprise'
        WHEN 'customPermissions' THEN 'enterprise'
        WHEN 'enterpriseTools' THEN 'enterprise'
        ELSE 'starter'
    END;
$$;

CREATE OR REPLACE FUNCTION organization_effective_plan(p_organization_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT normalize_subscription_plan(COALESCE(os.plan, os.subscription_plan, 'starter'))
    FROM organization_settings os
    WHERE os.organization_id = p_organization_id;
$$;

CREATE OR REPLACE FUNCTION organization_has_subscription_access(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_settings os
        WHERE os.organization_id = p_organization_id
          AND (
            os.subscription_status IN ('free', 'active')
            OR (
                os.subscription_status = 'trialing'
                AND (os.trial_ends_at IS NULL OR os.trial_ends_at > NOW())
            )
          )
    );
$$;

CREATE OR REPLACE FUNCTION organization_has_subscription_plan(
    p_organization_id UUID,
    p_required_plan TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_settings os
        WHERE os.organization_id = p_organization_id
          AND organization_has_subscription_access(p_organization_id)
          AND subscription_plan_rank(COALESCE(os.plan, os.subscription_plan)) >= subscription_plan_rank(p_required_plan)
    );
$$;

CREATE OR REPLACE FUNCTION organization_has_subscription_feature(
    p_organization_id UUID,
    p_feature TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_has_subscription_plan(
        p_organization_id,
        subscription_required_plan_for_feature(p_feature)
    );
$$;

CREATE OR REPLACE FUNCTION subscription_plan_limit(p_plan TEXT, p_limit_key TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE normalize_subscription_plan(p_plan)
        WHEN 'enterprise' THEN NULL
        WHEN 'business' THEN CASE p_limit_key
            WHEN 'outlets' THEN 10
            WHEN 'registers' THEN NULL
            WHEN 'users' THEN 50
            WHEN 'products' THEN NULL
            ELSE NULL
        END
        WHEN 'growth' THEN CASE p_limit_key
            WHEN 'outlets' THEN 2
            WHEN 'registers' THEN 5
            WHEN 'users' THEN 8
            WHEN 'products' THEN 10000
            ELSE NULL
        END
        ELSE CASE p_limit_key
            WHEN 'outlets' THEN 1
            WHEN 'registers' THEN 1
            WHEN 'users' THEN 2
            WHEN 'products' THEN 300
            ELSE NULL
        END
    END;
$$;

CREATE OR REPLACE FUNCTION enforce_product_subscription_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_product_limit INTEGER;
    v_product_count INTEGER;
    v_barcode_changed BOOLEAN := TRUE;
    v_expiry_changed BOOLEAN := TRUE;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        v_barcode_changed := NEW.barcode IS DISTINCT FROM OLD.barcode;
        v_expiry_changed := NEW.expiry_date IS DISTINCT FROM OLD.expiry_date;
    END IF;

    v_plan := COALESCE(organization_effective_plan(NEW.organization_id), 'starter');
    v_product_limit := subscription_plan_limit(v_plan, 'products');

    IF TG_OP = 'INSERT' AND v_product_limit IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_product_count
        FROM products
        WHERE organization_id = NEW.organization_id;

        IF v_product_count >= v_product_limit THEN
            RAISE EXCEPTION 'You have reached your product limit on %. Upgrade to add more products.', initcap(v_plan);
        END IF;
    END IF;

    IF COALESCE(NULLIF(trim(NEW.barcode), ''), NULL) IS NOT NULL
       AND v_barcode_changed
       AND NOT organization_has_subscription_feature(NEW.organization_id, 'barcodeScanning') THEN
        RAISE EXCEPTION 'Barcode scanning is available on Growth and higher plans.';
    END IF;

    IF NEW.expiry_date IS NOT NULL
       AND v_expiry_changed
       AND NOT organization_has_subscription_feature(NEW.organization_id, 'pharmacyExpiryTracking') THEN
        RAISE EXCEPTION 'Pharmacy expiry tracking is available on Business and higher plans.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_product_subscription_limits_trigger ON products;
CREATE TRIGGER enforce_product_subscription_limits_trigger
BEFORE INSERT OR UPDATE OF barcode, expiry_date ON products
FOR EACH ROW EXECUTE PROCEDURE enforce_product_subscription_limits();

CREATE OR REPLACE FUNCTION enforce_register_subscription_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_register_limit INTEGER;
    v_register_count INTEGER;
    v_current_register_id UUID := NULL;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        v_current_register_id := OLD.id;
    END IF;

    IF COALESCE(NEW.is_active, TRUE) IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    v_plan := COALESCE(organization_effective_plan(NEW.organization_id), 'starter');
    v_register_limit := subscription_plan_limit(v_plan, 'registers');

    IF v_register_limit IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*)
    INTO v_register_count
    FROM cash_registers
    WHERE organization_id = NEW.organization_id
      AND COALESCE(is_active, TRUE) IS TRUE
      AND (v_current_register_id IS NULL OR id <> v_current_register_id);

    IF v_register_count >= v_register_limit THEN
        RAISE EXCEPTION 'You have reached your register limit on %. Upgrade to add more registers.', initcap(v_plan);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_register_subscription_limits_trigger ON cash_registers;
CREATE TRIGGER enforce_register_subscription_limits_trigger
BEFORE INSERT OR UPDATE OF is_active ON cash_registers
FOR EACH ROW EXECUTE PROCEDURE enforce_register_subscription_limits();

CREATE OR REPLACE FUNCTION enforce_member_subscription_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_user_limit INTEGER;
    v_member_count INTEGER;
    v_current_member_id UUID := NULL;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        v_current_member_id := OLD.id;
    END IF;

    IF NEW.removed_at IS NOT NULL THEN
        RETURN NEW;
    END IF;

    v_plan := COALESCE(organization_effective_plan(NEW.organization_id), 'starter');
    v_user_limit := subscription_plan_limit(v_plan, 'users');

    IF v_user_limit IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*)
    INTO v_member_count
    FROM organization_members
    WHERE organization_id = NEW.organization_id
      AND removed_at IS NULL
      AND (v_current_member_id IS NULL OR id <> v_current_member_id);

    IF v_member_count >= v_user_limit THEN
        RAISE EXCEPTION 'You have reached your user limit on %. Upgrade to add more users.', initcap(v_plan);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_member_subscription_limits_trigger ON organization_members;
CREATE TRIGGER enforce_member_subscription_limits_trigger
BEFORE INSERT OR UPDATE OF removed_at ON organization_members
FOR EACH ROW EXECUTE PROCEDURE enforce_member_subscription_limits();

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
    v_plan TEXT;
    v_user_limit INTEGER;
    v_allocated_users INTEGER;
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

    v_plan := COALESCE(organization_effective_plan(p_organization_id), 'starter');
    v_user_limit := subscription_plan_limit(v_plan, 'users');

    IF v_user_limit IS NOT NULL THEN
        SELECT
            (
                SELECT COUNT(*)
                FROM organization_members
                WHERE organization_id = p_organization_id
                  AND removed_at IS NULL
            ) + (
                SELECT COUNT(*)
                FROM organization_invitations
                WHERE organization_id = p_organization_id
                  AND accepted_at IS NULL
                  AND cancelled_at IS NULL
                  AND expires_at > NOW()
                  AND lower(email) <> lower(p_email)
            )
        INTO v_allocated_users;

        IF v_allocated_users >= v_user_limit THEN
            RAISE EXCEPTION 'You have reached your user limit on %. Upgrade to invite more users.', initcap(v_plan);
        END IF;
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

CREATE OR REPLACE FUNCTION create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_currency TEXT DEFAULT 'USD'
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

    IF length(trim(p_name)) < 2 THEN
        RAISE EXCEPTION 'Organization name must be at least 2 characters.';
    END IF;

    IF v_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Organization slug can only contain lowercase letters, numbers, and hyphens.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM organizations
        WHERE slug = v_slug
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'This organization slug is already taken.';
    END IF;

    INSERT INTO organizations (name, slug, currency, owner_id)
    VALUES (trim(p_name), v_slug, v_currency, v_profile_id)
    RETURNING id INTO v_organization_id;

    INSERT INTO organization_members (organization_id, profile_id, role)
    VALUES (v_organization_id, v_profile_id, 'owner')
    ON CONFLICT (organization_id, profile_id)
    DO UPDATE SET role = 'owner', removed_at = NULL;

    INSERT INTO settings (organization_id)
    VALUES (v_organization_id)
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO organization_settings (
        organization_id,
        low_stock_threshold_default,
        plan,
        subscription_plan,
        subscription_status,
        billing_cycle,
        trial_ends_at,
        current_period_ends_at
    )
    VALUES (
        v_organization_id,
        5,
        'starter',
        'starter',
        'free',
        'monthly',
        NULL,
        NULL
    )
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
        jsonb_build_object('slug', v_slug, 'currency', v_currency)
    );

    RETURN v_organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION normalize_subscription_plan(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION subscription_plan_rank(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION subscription_required_plan_for_feature(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION organization_effective_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION organization_has_subscription_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION organization_has_subscription_plan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION organization_has_subscription_feature(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION subscription_plan_limit(TEXT, TEXT) TO authenticated;
