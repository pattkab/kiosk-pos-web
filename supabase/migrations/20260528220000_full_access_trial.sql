-- First-month trial: Business-tier features/limits while trialing; Starter free tier after expiry.

CREATE OR REPLACE FUNCTION organization_is_on_active_trial(p_organization_id UUID)
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
          AND os.subscription_status = 'trialing'
          AND (os.trial_ends_at IS NULL OR os.trial_ends_at > NOW())
    );
$$;

CREATE OR REPLACE FUNCTION organization_effective_plan(p_organization_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN organization_is_on_active_trial(p_organization_id) THEN 'business'
        ELSE normalize_subscription_plan(COALESCE(os.plan, os.subscription_plan, 'starter'))
    END
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
          AND os.subscription_status IN ('free', 'active', 'trialing')
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
    SELECT organization_has_subscription_access(p_organization_id)
      AND subscription_plan_rank(organization_effective_plan(p_organization_id))
          >= subscription_plan_rank(p_required_plan);
$$;

-- Restore 30-day full-access trial for new organizations (onboarding uses 4-arg RPC).
CREATE OR REPLACE FUNCTION create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_currency TEXT DEFAULT 'USD',
    p_business_type TEXT DEFAULT 'other'
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
    v_business_type TEXT;
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
    v_business_type := lower(coalesce(nullif(trim(p_business_type), ''), 'other'));

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

    IF v_business_type IN (
      'supermarket_or_shop',
      'pharmacy',
      'salon',
      'restaurant_or_hotel',
      'rental_accommodation',
      'other'
    ) THEN
      NULL;
    ELSIF v_business_type LIKE 'other:%' THEN
      NULL;
    ELSE
      v_business_type := 'other:' || trim(p_business_type);
    END IF;

    INSERT INTO organizations (name, slug, currency, business_type, owner_id)
    VALUES (trim(p_name), v_slug, v_currency, v_business_type, v_profile_id)
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
        trial_ends_at
    )
    VALUES (
        v_organization_id,
        5,
        'starter',
        'starter',
        'trialing',
        'monthly',
        NOW() + INTERVAL '30 days'
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
        jsonb_build_object(
          'slug', v_slug,
          'currency', v_currency,
          'business_type', v_business_type
        )
    );

    RETURN v_organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_currency TEXT DEFAULT 'USD'
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT create_organization_with_owner(p_name, p_slug, p_currency, 'other');
$$;

-- Orgs created as free Starter without a trial get a 30-day trial if still within their first month.
UPDATE organization_settings os
SET
    subscription_status = 'trialing',
    trial_ends_at = o.created_at + INTERVAL '30 days'
FROM organizations o
WHERE os.organization_id = o.id
  AND os.subscription_status = 'free'
  AND os.stripe_subscription_id IS NULL
  AND os.trial_ends_at IS NULL
  AND o.created_at > NOW() - INTERVAL '30 days';

-- Repair trialing rows that lost trial_ends_at during pricing migration.
UPDATE organization_settings os
SET trial_ends_at = o.created_at + INTERVAL '30 days'
FROM organizations o
WHERE os.organization_id = o.id
  AND os.subscription_status = 'trialing'
  AND os.trial_ends_at IS NULL
  AND os.stripe_subscription_id IS NULL;

GRANT EXECUTE ON FUNCTION organization_is_on_active_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT, TEXT) TO authenticated;
