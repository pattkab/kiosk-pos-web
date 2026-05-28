-- SaaS pricing tiers and reusable subscription feature checks.

ALTER TABLE organization_settings
    ALTER COLUMN subscription_plan SET DEFAULT 'starter';

ALTER TABLE organization_settings
    DROP CONSTRAINT IF EXISTS organization_settings_subscription_plan_check;

ALTER TABLE organization_settings
    ADD CONSTRAINT organization_settings_subscription_plan_check
    CHECK (subscription_plan IN ('starter', 'growth', 'pro'));

CREATE OR REPLACE FUNCTION subscription_plan_rank(p_plan TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_plan
        WHEN 'pro' THEN 2
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
        WHEN 'reports' THEN 'growth'
        WHEN 'team' THEN 'growth'
        WHEN 'offlineSync' THEN 'growth'
        WHEN 'notifications' THEN 'growth'
        WHEN 'advancedBranding' THEN 'pro'
        WHEN 'advancedPermissions' THEN 'pro'
        WHEN 'auditLogs' THEN 'pro'
        ELSE 'starter'
    END;
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
          AND (
            os.subscription_status = 'active'
            OR (
                os.subscription_status = 'trialing'
                AND os.trial_ends_at IS NOT NULL
                AND os.trial_ends_at > NOW()
            )
          )
          AND (
            (
                os.subscription_status = 'trialing'
                AND os.trial_ends_at IS NOT NULL
                AND os.trial_ends_at > NOW()
            )
            OR subscription_plan_rank(os.subscription_plan) >= subscription_plan_rank(p_required_plan)
          )
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

GRANT EXECUTE ON FUNCTION subscription_plan_rank(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION subscription_required_plan_for_feature(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION organization_has_subscription_plan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION organization_has_subscription_feature(UUID, TEXT) TO authenticated;
