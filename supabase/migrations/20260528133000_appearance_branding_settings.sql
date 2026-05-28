-- Organization-level appearance controls.

ALTER TABLE organization_settings
    ADD COLUMN IF NOT EXISTS theme_primary_color TEXT NOT NULL DEFAULT '#2563eb',
    ADD COLUMN IF NOT EXISTS theme_accent_color TEXT NOT NULL DEFAULT '#10b981';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organization_settings_theme_primary_color_hex'
    ) THEN
        ALTER TABLE organization_settings
            ADD CONSTRAINT organization_settings_theme_primary_color_hex
            CHECK (theme_primary_color ~ '^#[0-9A-Fa-f]{6}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organization_settings_theme_accent_color_hex'
    ) THEN
        ALTER TABLE organization_settings
            ADD CONSTRAINT organization_settings_theme_accent_color_hex
            CHECK (theme_accent_color ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;
