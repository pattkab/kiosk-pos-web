-- Realtime publication setup for organization-scoped live updates.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'inventory_transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transactions;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'sales'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE sales;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'payments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE payments;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'activity_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'register_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE register_sessions;
    END IF;
END $$;

ALTER TABLE products REPLICA IDENTITY FULL;
ALTER TABLE inventory_transactions REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE activity_logs REPLICA IDENTITY FULL;
ALTER TABLE register_sessions REPLICA IDENTITY FULL;
