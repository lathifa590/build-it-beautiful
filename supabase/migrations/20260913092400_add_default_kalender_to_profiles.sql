-- Add default_kalender column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_kalender JSONB DEFAULT NULL;

-- Add a helpful comment
COMMENT ON COLUMN profiles.default_kalender IS 'Saves the user''s default academic calendar configuration';
