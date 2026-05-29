-- Yo Payments Uganda: track in-flight collections before sale checkout completes.

DO $$
BEGIN
    CREATE TYPE yo_collection_method AS ENUM (
        'mtn_mobile_money',
        'airtel_money',
        'visa',
        'mastercard',
        'card'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE yo_collection_status AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payment_collections (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_collections_external_ref
    ON payment_collections(organization_id, external_reference);

CREATE INDEX IF NOT EXISTS idx_payment_collections_org_status
    ON payment_collections(organization_id, status, created_at DESC);

ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'payment_collections'
          AND policyname = 'Members can view payment collections'
    ) THEN
        CREATE POLICY "Members can view payment collections"
            ON payment_collections FOR SELECT
            USING (organization_id IN (SELECT get_user_organizations()));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'payment_collections'
          AND policyname = 'Cashiers can insert payment collections'
    ) THEN
        CREATE POLICY "Cashiers can insert payment collections"
            ON payment_collections FOR INSERT
            WITH CHECK (organization_id IN (SELECT get_user_organizations()));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'payment_collections'
          AND policyname = 'Cashiers can update payment collections'
    ) THEN
        CREATE POLICY "Cashiers can update payment collections"
            ON payment_collections FOR UPDATE
            USING (organization_id IN (SELECT get_user_organizations()));
    END IF;
END $$;

CREATE OR REPLACE FUNCTION set_payment_collections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_collections_updated_at ON payment_collections;

CREATE TRIGGER payment_collections_updated_at
    BEFORE UPDATE ON payment_collections
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_collections_updated_at();
