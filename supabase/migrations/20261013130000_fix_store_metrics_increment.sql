-- ==============================================================
-- Migrasi: Perbaikan Pencatatan Metrik Toko & Modul
-- ==============================================================
-- Memastikan kolom store_views dan product_views ada pada
-- tabel modul_store_metrics dan menyiapkan RPC fungsi pendukung.
-- ==============================================================

ALTER TABLE public.modul_store_metrics 
ADD COLUMN IF NOT EXISTS store_views INTEGER DEFAULT 0;

ALTER TABLE public.modul_store_metrics 
ADD COLUMN IF NOT EXISTS product_views INTEGER DEFAULT 0;

-- Kebijakan RLS agar aman diakses
ALTER TABLE public.modul_store_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert metrics" ON public.modul_store_metrics;
CREATE POLICY "Public can insert metrics" ON public.modul_store_metrics
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update metrics" ON public.modul_store_metrics;
CREATE POLICY "Public can update metrics" ON public.modul_store_metrics
  FOR UPDATE USING (true);
