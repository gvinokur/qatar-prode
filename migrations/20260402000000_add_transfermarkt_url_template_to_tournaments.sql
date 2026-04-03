ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS transfermarkt_url_template TEXT;
