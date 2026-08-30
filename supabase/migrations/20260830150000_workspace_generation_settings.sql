-- Migration: Workspace Global Settings Phase 1
-- Adds the `generation_settings` column to `workspaces` table to store global module generation preferences

ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS generation_settings JSONB DEFAULT '{}'::jsonb;

-- Example structure of generation_settings:
-- {
--   "modelPembelajaran": "Project Based Learning (PjBL)", // or "AI Auto-Select"
--   "metodePembelajaran": ["Ceramah Interaktif", "Diskusi Kelompok"], // or ["AI Auto-Select"]
--   "soalConfig": {
--     "pilihanGanda": 5,
--     "essay": 5,
--     ...
--   }
-- }
