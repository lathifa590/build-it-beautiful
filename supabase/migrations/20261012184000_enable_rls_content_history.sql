-- ==============================================================
-- Migrasi: Mengaktifkan RLS & Kebijakan Akses pada content_history
-- Mengatasi peringatan keamanan kritis Supabase: "RLS Disabled in Public"
-- ==============================================================

-- 1. Aktifkan Row Level Security pada tabel content_history
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan SELECT: Pengguna hanya dapat membaca riwayat milik mereka sendiri
DROP POLICY IF EXISTS "Users can view their own content_history" ON public.content_history;
CREATE POLICY "Users can view their own content_history"
  ON public.content_history FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Kebijakan INSERT: Pengguna hanya dapat membuat riwayat dengan user_id mereka sendiri
DROP POLICY IF EXISTS "Users can insert their own content_history" ON public.content_history;
CREATE POLICY "Users can insert their own content_history"
  ON public.content_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Kebijakan UPDATE: Pengguna hanya dapat memperbarui riwayat milik mereka sendiri
DROP POLICY IF EXISTS "Users can update their own content_history" ON public.content_history;
CREATE POLICY "Users can update their own content_history"
  ON public.content_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Kebijakan DELETE: Pengguna hanya dapat menghapus riwayat milik mereka sendiri
DROP POLICY IF EXISTS "Users can delete their own content_history" ON public.content_history;
CREATE POLICY "Users can delete their own content_history"
  ON public.content_history FOR DELETE
  USING (auth.uid() = user_id);
