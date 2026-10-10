-- ==============================================================
-- Migrasi: Perbaikan Kebocoran RLS Workspace & Entitas Terkait
-- ==============================================================
-- Menghapus policy over-permissive yang mengizinkan admin atau
-- sesama guru di sekolah membaca seluruh workspace / dokumen
-- via SELECT langsung ke tabel public.workspaces dkk.
-- Fitur Bank Modul Sekolah tetap berjalan aman karena sepenuhnya
-- menggunakan RPC berstatus SECURITY DEFINER yang memiliki validasi
-- sekolah dan otorisasi terisolasi.
-- ==============================================================

DROP POLICY IF EXISTS "School members can view school workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "School members can view curriculum plans" ON public.curriculum_plans;
DROP POLICY IF EXISTS "School members can view prosem items" ON public.prosem_items;
DROP POLICY IF EXISTS "School members can view meeting slots" ON public.meeting_slots;
DROP POLICY IF EXISTS "School members can view meeting document links" ON public.meeting_document_links;
DROP POLICY IF EXISTS "School members can view school documents" ON public.documents;
DROP POLICY IF EXISTS "School members can view document versions" ON public.document_versions;
