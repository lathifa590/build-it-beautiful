-- Add archive support to workspaces table
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_workspaces_archived ON public.workspaces(user_id, is_archived);
