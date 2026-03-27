-- Add ad-free flag to users
ALTER TABLE users ADD COLUMN is_ad_free BOOLEAN NOT NULL DEFAULT FALSE;

-- Create singleton ad_settings table
CREATE TABLE ad_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modal_min_minutes_between   INTEGER NOT NULL DEFAULT 30,
  modal_min_pageviews_between INTEGER NOT NULL DEFAULT 10,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_ad_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ad_settings_updated_at_trigger
  BEFORE UPDATE ON ad_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ad_settings_updated_at();

-- Seed one default row
INSERT INTO ad_settings (modal_min_minutes_between, modal_min_pageviews_between)
VALUES (30, 10);
