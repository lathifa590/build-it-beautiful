-- ==============================================================
-- Migrasi: Penambahan Kolom school_name pada Tabel workspaces
-- ==============================================================
-- Menambahkan kolom school_name ke tabel public.workspaces (opsional)
-- agar kompatibel baik secara kolom database langsung maupun 
-- fallback JSONB generation_settings.
-- ==============================================================

ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS school_name TEXT;
