-- Fix workspaces schema by adding missing columns
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS jp_duration_minutes integer NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS default_jp_per_meeting integer NOT NULL DEFAULT 2;

-- Force PostgREST to reload the schema cache so the API recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
