-- Migration to add weekly_jp_pattern to workspaces
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS weekly_jp_pattern text;

-- Force PostgREST to reload the schema cache so the API recognizes the new column immediately
NOTIFY pgrst, 'reload schema';
