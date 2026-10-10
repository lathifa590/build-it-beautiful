-- ==============================================================
-- Migrasi: Penambahan Cakupan Produk pada Kupon Toko Modul
-- ==============================================================
-- Menambahkan kolom scope_type ('GLOBAL' atau 'SPECIFIC') dan
-- applicable_listing_ids (JSONB array ID listing modul ajar).
-- ==============================================================

ALTER TABLE public.modul_store_coupons 
  ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'GLOBAL',
  ADD COLUMN IF NOT EXISTS applicable_listing_ids JSONB DEFAULT '[]'::jsonb;
