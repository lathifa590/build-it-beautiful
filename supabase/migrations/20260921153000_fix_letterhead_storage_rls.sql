-- Migration: Fix Letterhead Storage RLS Policies
-- Memperbaiki error 'StorageApiError: new row violates row-level security policy'
-- saat upload atau upsert Kop Sekolah ke bucket 'letterheads'.

-- 1. Pastikan bucket 'letterheads' terdaftar dan bersifat public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'letterheads',
  'letterheads',
  true,
  524288, -- 500KB
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 524288,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg'];

-- 2. Drop semua policy lama pada storage.objects untuk letterheads
DROP POLICY IF EXISTS "Users can upload own letterhead" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own letterhead" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own letterhead" ON storage.objects;
DROP POLICY IF EXISTS "Letterheads are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload letterheads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update letterheads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete letterheads" ON storage.objects;
DROP POLICY IF EXISTS "Public can view letterheads" ON storage.objects;

-- 3. Policy SELECT: Publik dan user dapat membaca/melihat gambar kop surat
CREATE POLICY "Letterheads are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'letterheads');

-- 4. Policy INSERT: User authenticated dapat mengupload kop ke foldernya sendiri (atau Admin)
CREATE POLICY "Users can upload own letterhead"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'letterheads'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
    OR auth.uid() = owner
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 5. Policy UPDATE: User authenticated dapat mengupdate kop miliknya sendiri (atau Admin)
-- WAJIB memiliki klausa USING dan WITH CHECK agar operasi upsert (INSERT ... ON CONFLICT DO UPDATE) tidak ditolak Postgres RLS
CREATE POLICY "Users can update own letterhead"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'letterheads'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
    OR auth.uid() = owner
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  bucket_id = 'letterheads'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
    OR auth.uid() = owner
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 6. Policy DELETE: User authenticated dapat menghapus file kop miliknya sendiri (atau Admin)
CREATE POLICY "Users can delete own letterhead"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'letterheads'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR name LIKE auth.uid()::text || '/%'
    OR auth.uid() = owner
    OR public.has_role(auth.uid(), 'admin')
  )
);
