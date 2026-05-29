-- Yo Payments Uganda: track in-flight collections before sale checkout completes.

CREATE TYPE yo_collection_method AS ENUM (
    'mtn_mobile_money',
    'airtel_money',
    'visa',
    'mastercard',
    'card'
);

CREATE TYPE yo_collection_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);

CREATE TABLE payment_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    register_session_id UUID REFERENCES register_sessions(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'UGX',
    method yo_collection_method NOT NULL,
    status yo_collection_status NOT NULL DEFAULT 'pending',
    payer_phone TEXT,
    narrative TEXT,
    external_reference TEXT NOT NULL,
    yo_transaction_reference TEXT,
    network_reference TEXT,
    failure_reason TEXT,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_payment_collections_external_ref
    ON payment_collections(organization_id, external_reference);

CREATE INDEX idx_payment_collections_org_status
    ON payment_collections(organization_id, status, created_at DESC);

ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payment collections"
    ON payment_collections FOR SELECT
    USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Cashiers can insert payment collections"
    ON payment_collections FOR INSERT
    WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Cashiers can update payment collections"
    ON payment_collections FOR UPDATE
    USING (organization_id IN (SELECT get_user_organizations()));

CREATE OR REPLACE FUNCTION set_payment_collections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER payment_collections_updated_at
    BEFORE UPDATE ON payment_collections
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_collections_updated_at();
