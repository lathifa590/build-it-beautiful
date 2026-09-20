-- Migration: Mode Sekolah Fase S2 (Bank Modul, Berbagi Dokumen, & Feedback Penjaminan Mutu)
-- Mengizinkan guru berbagi modul ke bank sekolah, Waka/Kepsek mereview dengan rubrik checklist, dan guru lain menduplikasi template.

-- 0. Helper Functions (jika belum ada)
CREATE OR REPLACE FUNCTION public.is_school_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND school_status = 'active' AND school_id IS NOT NULL
  );
$$;

-- 1. Tabel school_documents
CREATE TABLE IF NOT EXISTS public.school_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  source_version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'modul', 'lkpd', 'asesmen', 'materi', 'refleksi', 'soal', 'rpp'
  subject TEXT,
  grade TEXT,
  phase TEXT,
  academic_year TEXT,
  semester SMALLINT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_review', 'approved', 'revision', 'template')) DEFAULT 'pending_review',
  is_template BOOLEAN NOT NULL DEFAULT false,
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks untuk pencarian cepat di bank sekolah
CREATE INDEX IF NOT EXISTS idx_school_docs_school_id ON public.school_documents(school_id);
CREATE INDEX IF NOT EXISTS idx_school_docs_status ON public.school_documents(status);
CREATE INDEX IF NOT EXISTS idx_school_docs_subject ON public.school_documents(subject);
CREATE INDEX IF NOT EXISTS idx_school_docs_type ON public.school_documents(document_type);


-- 2. Tabel school_document_comments (Feedback & Rubrik Checklist Waka)
CREATE TABLE IF NOT EXISTS public.school_document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_document_id UUID NOT NULL REFERENCES public.school_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb, -- { cp_tp_sesuai: true, waktu_sesuai: true, asesmen_lengkap: true, diferensiasi_ada: true }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_doc_comments_doc_id ON public.school_document_comments(school_document_id);


-- 3. Row Level Security (RLS)
ALTER TABLE public.school_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_document_comments ENABLE ROW LEVEL SECURITY;

-- Policy Select school_documents:
-- Anggota aktif sekolah yang sama atau Admin dapat melihat seluruh dokumen di Bank Sekolah
DROP POLICY IF EXISTS "Members can view school documents" ON public.school_documents;
CREATE POLICY "Members can view school documents"
  ON public.school_documents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR school_id = public.get_auth_school_id()
  );

-- Policy Insert school_documents:
-- Guru / Waka / Kepsek yang aktif di sekolah tersebut dapat membagikan dokumen
DROP POLICY IF EXISTS "Members can share documents to school" ON public.school_documents;
CREATE POLICY "Members can share documents to school"
  ON public.school_documents FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id()
      AND shared_by = auth.uid()
    )
  );

-- Policy Update school_documents:
-- Pemilik dokumen dapat mengupdate konten/judul; Waka/Admin/Kepsek dapat mengupdate status review & template
DROP POLICY IF EXISTS "Members and Waka can update school documents" ON public.school_documents;
CREATE POLICY "Members and Waka can update school documents"
  ON public.school_documents FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id()
      AND (
        shared_by = auth.uid()
        OR public.get_auth_school_role() IN ('waka', 'kepsek')
      )
    )
  );

-- Policy Delete school_documents:
-- Pemilik dokumen atau Waka/Admin dapat menghapus dokumen dari bank sekolah
DROP POLICY IF EXISTS "Owner or Waka can delete school documents" ON public.school_documents;
CREATE POLICY "Owner or Waka can delete school documents"
  ON public.school_documents FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id()
      AND (
        shared_by = auth.uid()
        OR public.get_auth_school_role() IN ('waka')
      )
    )
  );

-- Policy Comments:
-- Anggota sekolah dapat melihat komentar pada dokumen sekolahnya
DROP POLICY IF EXISTS "Members can view comments on school documents" ON public.school_document_comments;
CREATE POLICY "Members can view comments on school documents"
  ON public.school_document_comments FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.school_documents sd
      WHERE sd.id = school_document_comments.school_document_id
        AND sd.school_id = public.get_auth_school_id()
    )
  );

-- Anggota sekolah dapat memberikan komentar
DROP POLICY IF EXISTS "Members can add comments on school documents" ON public.school_document_comments;
CREATE POLICY "Members can add comments on school documents"
  ON public.school_document_comments FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.school_documents sd
        WHERE sd.id = school_document_comments.school_document_id
          AND sd.school_id = public.get_auth_school_id()
      )
    )
  );


-- 4. RPC: Bagikan Dokumen ke Bank Sekolah (Copy-on-Share)
CREATE OR REPLACE FUNCTION public.share_document_to_school(
  _school_id UUID,
  _title TEXT,
  _document_type TEXT,
  _content_json JSONB,
  _workspace_id UUID DEFAULT NULL,
  _source_document_id UUID DEFAULT NULL,
  _subject TEXT DEFAULT NULL,
  _grade TEXT DEFAULT NULL,
  _phase TEXT DEFAULT NULL,
  _academic_year TEXT DEFAULT NULL,
  _semester SMALLINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_user_school_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  SELECT school_id INTO v_user_school_id
  FROM public.profiles
  WHERE user_id = auth.uid() AND school_status = 'active';

  IF v_user_school_id IS NULL OR v_user_school_id != _school_id THEN
    -- Kecuali admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RETURN jsonb_build_object('success', false, 'message', 'Anda belum terdaftar aktif di sekolah ini');
    END IF;
  END IF;

  INSERT INTO public.school_documents (
    school_id,
    workspace_id,
    source_document_id,
    title,
    document_type,
    subject,
    grade,
    phase,
    academic_year,
    semester,
    content_json,
    shared_by,
    status,
    created_at,
    updated_at
  )
  VALUES (
    _school_id,
    _workspace_id,
    _source_document_id,
    trim(_title),
    _document_type,
    _subject,
    _grade,
    _phase,
    _academic_year,
    _semester,
    _content_json,
    auth.uid(),
    'pending_review',
    now(),
    now()
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'document_id', v_new_id,
    'message', 'Dokumen berhasil dibagikan ke Bank Sekolah dan menunggu peninjauan Waka Kurikulum.'
  );
END;
$$;


-- 5. RPC: Review Dokumen Sekolah (Waka / Kepsek / Admin)
CREATE OR REPLACE FUNCTION public.review_school_document(
  _document_id UUID,
  _status TEXT, -- 'approved', 'revision', 'template'
  _review_notes TEXT DEFAULT NULL,
  _is_template BOOLEAN DEFAULT false,
  _checklist JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc RECORD;
  v_is_waka_or_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  SELECT id, school_id, title INTO v_doc
  FROM public.school_documents
  WHERE id = _document_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dokumen tidak ditemukan');
  END IF;

  v_is_waka_or_admin := public.has_role(auth.uid(), 'admin') OR (
    v_doc.school_id = public.get_auth_school_id()
    AND public.get_auth_school_role() IN ('waka', 'kepsek')
  );

  IF NOT v_is_waka_or_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hanya Waka Kurikulum atau Kepala Sekolah yang dapat memberikan review');
  END IF;

  UPDATE public.school_documents
  SET status = _status,
      is_template = _is_template,
      review_notes = _review_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _document_id;

  -- Jika ada review_notes atau checklist, simpan juga sebagai riwayat komentar
  IF (_review_notes IS NOT NULL AND trim(_review_notes) != '') OR _checklist != '{}'::jsonb THEN
    INSERT INTO public.school_document_comments (
      school_document_id,
      user_id,
      comment,
      checklist
    )
    VALUES (
      _document_id,
      auth.uid(),
      COALESCE(_review_notes, 'Penilaian rubrik mutu kurikulum oleh Waka/Kepsek'),
      _checklist
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Status dokumen berhasil diperbarui menjadi: ' || _status
  );
END;
$$;


-- 6. View / Function Rekap Bank Modul Sekolah
CREATE OR REPLACE FUNCTION public.get_school_bank_documents(
  _school_id UUID,
  _status TEXT DEFAULT NULL,
  _subject TEXT DEFAULT NULL,
  _doc_type TEXT DEFAULT NULL,
  _is_template BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  school_id UUID,
  workspace_id UUID,
  source_document_id UUID,
  title TEXT,
  document_type TEXT,
  subject TEXT,
  grade TEXT,
  phase TEXT,
  academic_year TEXT,
  semester SMALLINT,
  content_json JSONB,
  shared_by UUID,
  shared_by_name TEXT,
  shared_by_email TEXT,
  status TEXT,
  is_template BOOLEAN,
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  comments_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sd.id,
    sd.school_id,
    sd.workspace_id,
    sd.source_document_id,
    sd.title,
    sd.document_type,
    sd.subject,
    sd.grade,
    sd.phase,
    sd.academic_year,
    sd.semester,
    sd.content_json,
    sd.shared_by,
    COALESCE(p.display_name, 'Guru') AS shared_by_name,
    p.email AS shared_by_email,
    sd.status,
    sd.is_template,
    sd.review_notes,
    sd.reviewed_by,
    sd.reviewed_at,
    COUNT(c.id) AS comments_count,
    sd.created_at,
    sd.updated_at
  FROM public.school_documents sd
  LEFT JOIN public.profiles p ON p.user_id = sd.shared_by
  LEFT JOIN public.school_document_comments c ON c.school_document_id = sd.id
  WHERE sd.school_id = _school_id
    AND (_status IS NULL OR sd.status = _status)
    AND (_subject IS NULL OR sd.subject ILIKE '%' || _subject || '%')
    AND (_doc_type IS NULL OR sd.document_type = _doc_type)
    AND (_is_template IS NULL OR sd.is_template = _is_template)
  GROUP BY sd.id, p.display_name, p.email
  ORDER BY sd.is_template DESC, sd.created_at DESC;
END;
$$;
