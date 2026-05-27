ALTER TABLE organization_settings
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_org_settings_stripe_customer_id
    ON organization_settings(stripe_customer_id);
