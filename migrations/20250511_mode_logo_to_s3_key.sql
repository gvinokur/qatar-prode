-- PostgreSQL script to extract S3 paths from logo URLs and update the theme column

-- Begin a transaction to ensure all updates are atomic
BEGIN;

-- Create a temporary function to extract the path from an S3 URL
CREATE OR REPLACE FUNCTION extract_s3_path(url TEXT)
RETURNS TEXT AS $$
DECLARE
    path TEXT;
BEGIN
    -- Extract the path after the domain name
    -- This regex looks for the path after amazonaws.com or any subdomain
    SELECT regexp_replace(url, '^https?://[^/]+(amazonaws\.com)/([^?#]*)', '\2') INTO path;

    -- Remove any leading slash
    IF left(path, 1) = '/' THEN
        path := substring(path from 2);
    END IF;

    RETURN path;
END;
$$ LANGUAGE plpgsql;

-- Update the table
-- Assuming the table is named 'your_table' and the column is 'theme'
UPDATE tournaments
SET theme = to_json(jsonb_set(
        jsonb_set(
            to_jsonb(theme),
            CAST('{s3_logo_key}' as text[]),
            to_jsonb(extract_s3_path(theme->>'logo'))
        ),
        CAST('{is_s3_logo}' as text[]),
        'true'::jsonb
    ))
WHERE
    theme->>'logo' IS NOT NULL
    AND theme->>'logo' LIKE '%la-maquina-prode-group-images%';

UPDATE prode_groups
SET theme = to_json(jsonb_set(
        jsonb_set(
                to_jsonb(theme),
                CAST('{s3_logo_key}' as text[]),
                to_jsonb(extract_s3_path(theme->>'logo'))
        ),
        CAST('{is_s3_logo}' as text[]),
        'true'::jsonb
                    ))
WHERE
    theme->>'logo' IS NOT NULL
  AND theme->>'logo' LIKE '%la-maquina-prode-group-images%';


UPDATE teams
SET theme = to_json(jsonb_set(
        jsonb_set(
                to_jsonb(theme),
                CAST('{s3_logo_key}' as text[]),
                to_jsonb(extract_s3_path(theme->>'logo'))
        ),
        CAST('{is_s3_logo}' as text[]),
        'true'::jsonb
                    ))
WHERE
    theme->>'logo' IS NOT NULL
  AND theme->>'logo' LIKE '%la-maquina-prode-group-images%';

-- Drop the temporary function
DROP FUNCTION extract_s3_path(TEXT);

-- Commit the transaction
COMMIT;
