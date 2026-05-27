ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'expiring_soon';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'failed_sale';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'register_discrepancy';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'inventory_adjustment';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'user_activity';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'daily_summary';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'system';
