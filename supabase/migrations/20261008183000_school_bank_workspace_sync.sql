-- ==============================================================
-- Migrasi: Sinkronisasi Workspace Guru ke Bank Modul Sekolah (Opsi 2)
-- ==============================================================
-- 1. RPC get_school_workspace_documents:
--    Mengambil seluruh dokumen hasil penyusunan guru di workspace
--    sekolah terkait, lengkap dengan status apakah sudah dibagikan ke Bank.
-- 2. RPC get_school_workspace_document_detail:
--    Mengambil konten JSON dokumen workspace untuk pratinjau Waka.
-- 3. RPC promote_workspace_doc_to_school_bank:
--    Memasukkan dokumen dari workspace ke Bank Modul Sekolah (dapat langsung disetujui / dijadikan template).
-- 4. RPC bulk_promote_workspace_docs_to_school_bank:
--    Memasukkan semua dokumen siap pakai dari guru ke Bank Modul secara massal oleh Waka Kurikulum.
-- ==============================================================

-- 1. RPC get_school_workspace_documents
CREATE OR REPLACE FUNCTION public.get_school_workspace_documents(
  _school_id UUID,
  _teacher_id UUID DEFAULT NULL,
  _subject TEXT DEFAULT NULL,
  _doc_type TEXT DEFAULT NULL,
  _search TEXT DEFAULT NULL
)
RETURNS TABLE (
  document_id UUID,
  workspace_id UUID,
  title TEXT,
  document_type TEXT,
  status TEXT,
  subject TEXT,
  grade TEXT,
  phase TEXT,
  academic_year TEXT,
  teacher_id UUID,
  teacher_name TEXT,
  teacher_email TEXT,
  teacher_role TEXT,
  is_shared_to_bank BOOLEAN,
  school_document_id UUID,
  bank_status TEXT,
  is_official_template BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Wajib Admin atau anggota aktif sekolah terkait
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.get_auth_school_id() = _school_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.id AS document_id,
    w.id AS workspace_id,
    d.title,
    d.document_type,
    d.status,
    COALESCE(w.subject, '') AS subject,
    COALESCE(w.grade, '') AS grade,
    COALESCE(w.phase, '') AS phase,
    COALESCE(w.academic_year, '') AS academic_year,
    p.user_id AS teacher_id,
    COALESCE(p.display_name, 'Guru') AS teacher_name,
    COALESCE(p.email, '') AS teacher_email,
    COALESCE(p.school_role, 'guru') AS teacher_role,
    (sd.id IS NOT NULL) AS is_shared_to_bank,
    sd.id AS school_document_id,
    sd.status AS bank_status,
    COALESCE(sd.is_template, false) AS is_official_template,
    d.created_at,
    d.updated_at
  FROM public.documents d
  JOIN public.workspaces w ON w.id = d.workspace_id
  JOIN public.profiles p ON p.user_id = d.user_id
  LEFT JOIN public.school_documents sd ON sd.source_document_id = d.id AND sd.school_id = _school_id
  WHERE p.school_id = _school_id
    AND p.school_status = 'active'
    AND d.deleted_at IS NULL
    AND d.document_type != 'form_data'
    AND (_teacher_id IS NULL OR d.user_id = _teacher_id)
    AND (_subject IS NULL OR _subject = 'all' OR w.subject ILIKE '%' || _subject || '%')
    AND (_doc_type IS NULL OR _doc_type = 'all' OR d.document_type = _doc_type)
    AND (
      _search IS NULL OR _search = ''
      OR d.title ILIKE '%' || _search || '%'
      OR w.subject ILIKE '%' || _search || '%'
      OR p.display_name ILIKE '%' || _search || '%'
    )
  ORDER BY d.created_at DESC;
END;
$$;

-- 2. RPC get_school_workspace_document_detail
CREATE OR REPLACE FUNCTION public.get_school_workspace_document_detail(
  _school_id UUID,
  _document_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc RECORD;
  v_content JSONB;
BEGIN
  -- Security check: Admin atau anggota aktif sekolah terkait
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.get_auth_school_id() = _school_id
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT
    d.id,
    d.workspace_id,
    d.title,
    d.document_type,
    d.status,
    COALESCE(w.subject, '') AS subject,
    COALESCE(w.grade, '') AS grade,
    COALESCE(w.phase, '') AS phase,
    COALESCE(w.academic_year, '') AS academic_year,
    p.user_id AS teacher_id,
    COALESCE(p.display_name, 'Guru') AS teacher_name,
    COALESCE(p.email, '') AS teacher_email,
    d.created_at,
    d.current_version_id
  INTO v_doc
  FROM public.documents d
  JOIN public.workspaces w ON w.id = d.workspace_id
  JOIN public.profiles p ON p.user_id = d.user_id
  WHERE d.id = _document_id
    AND p.school_id = _school_id
    AND p.school_status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Dokumen tidak ditemukan');
  END IF;

  -- Cari content_json dari current_version atau versi terbaru
  IF v_doc.current_version_id IS NOT NULL THEN
    SELECT content_json INTO v_content
    FROM public.document_versions
    WHERE id = v_doc.current_version_id;
  END IF;

  IF v_content IS NULL THEN
    SELECT content_json INTO v_content
    FROM public.document_versions
    WHERE document_id = _document_id
    ORDER BY version_number DESC
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'id', v_doc.id,
    'workspace_id', v_doc.workspace_id,
    'title', v_doc.title,
    'document_type', v_doc.document_type,
    'status', v_doc.status,
    'subject', v_doc.subject,
    'grade', v_doc.grade,
    'phase', v_doc.phase,
    'academic_year', v_doc.academic_year,
    'teacher_id', v_doc.teacher_id,
    'teacher_name', v_doc.teacher_name,
    'teacher_email', v_doc.teacher_email,
    'content_json', COALESCE(v_content, '{}'::jsonb),
    'created_at', v_doc.created_at
  );
END;
$$;

-- 3. RPC promote_workspace_doc_to_school_bank
CREATE OR REPLACE FUNCTION public.promote_workspace_doc_to_school_bank(
  _school_id UUID,
  _document_id UUID,
  _is_template BOOLEAN DEFAULT false,
  _notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc RECORD;
  v_content JSONB;
  v_existing_id UUID;
  v_new_id UUID;
  v_caller_role TEXT;
  v_target_status TEXT;
BEGIN
  -- Security check
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.get_auth_school_id() = _school_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  v_caller_role := public.get_auth_school_role();

  -- Cari dokumen
  SELECT
    d.id,
    d.user_id,
    d.workspace_id,
    d.title,
    d.document_type,
    w.subject,
    w.grade,
    w.phase,
    w.academic_year,
    d.current_version_id
  INTO v_doc
  FROM public.documents d
  JOIN public.workspaces w ON w.id = d.workspace_id
  JOIN public.profiles p ON p.user_id = d.user_id
  WHERE d.id = _document_id
    AND p.school_id = _school_id
    AND p.school_status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dokumen tidak ditemukan');
  END IF;

  -- Ambil content_json
  IF v_doc.current_version_id IS NOT NULL THEN
    SELECT content_json INTO v_content
    FROM public.document_versions
    WHERE id = v_doc.current_version_id;
  END IF;

  IF v_content IS NULL THEN
    SELECT content_json INTO v_content
    FROM public.document_versions
    WHERE document_id = _document_id
    ORDER BY version_number DESC
    LIMIT 1;
  END IF;

  -- Tentukan status
  -- Jika Waka, Kepsek, atau Admin yang mempromosikan, status langsung 'approved'
  IF v_caller_role IN ('waka', 'kepsek') OR public.has_role(auth.uid(), 'admin') THEN
    v_target_status := 'approved';
  ELSE
    v_target_status := 'pending_review';
  END IF;

  -- Cek apakah sudah pernah dimasukkan ke school_documents
  SELECT id INTO v_existing_id
  FROM public.school_documents
  WHERE school_id = _school_id AND source_document_id = _document_id;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.school_documents
    SET
      title = v_doc.title,
      content_json = COALESCE(v_content, '{}'::jsonb),
      is_template = CASE WHEN _is_template THEN true ELSE is_template END,
      status = CASE WHEN v_caller_role IN ('waka', 'kepsek') OR public.has_role(auth.uid(), 'admin') THEN 'approved' ELSE status END,
      review_notes = COALESCE(_notes, review_notes),
      reviewed_by = CASE WHEN v_caller_role IN ('waka', 'kepsek') OR public.has_role(auth.uid(), 'admin') THEN auth.uid() ELSE reviewed_by END,
      reviewed_at = CASE WHEN v_caller_role IN ('waka', 'kepsek') OR public.has_role(auth.uid(), 'admin') THEN now() ELSE reviewed_at END,
      updated_at = now()
    WHERE id = v_existing_id;

    RETURN jsonb_build_object('success', true, 'message', 'Dokumen di Bank Sekolah berhasil diperbarui', 'school_document_id', v_existing_id);
  ELSE
    -- Insert new
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
      content_json,
      shared_by,
      status,
      is_template,
      review_notes,
      reviewed_by,
      reviewed_at
    )
    VALUES (
      _school_id,
      v_doc.workspace_id,
      v_doc.id,
      v_doc.title,
      v_doc.document_type,
      v_doc.subject,
      v_doc.grade,
      v_doc.phase,
      v_doc.academic_year,
      COALESCE(v_content, '{}'::jsonb),
      v_doc.user_id,
      v_target_status,
      _is_template,
      _notes,
      CASE WHEN v_caller_role IN ('waka', 'kepsek') OR public.has_role(auth.uid(), 'admin') THEN auth.uid() ELSE NULL END,
      CASE WHEN v_caller_role IN ('waka', 'kepsek') OR public.has_role(auth.uid(), 'admin') THEN now() ELSE NULL END
    )
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'message', 'Dokumen berhasil ditambahkan ke Bank Sekolah', 'school_document_id', v_new_id);
  END IF;
END;
$$;

-- 4. RPC bulk_promote_workspace_docs_to_school_bank
CREATE OR REPLACE FUNCTION public.bulk_promote_workspace_docs_to_school_bank(
  _school_id UUID,
  _workspace_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count INT := 0;
  v_rec RECORD;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (public.get_auth_school_id() = _school_id AND public.get_auth_school_role() IN ('waka', 'kepsek'))
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hanya Waka/Kepsek yang dapat melakukan aksi massal');
  END IF;

  FOR v_rec IN
    SELECT d.id
    FROM public.documents d
    JOIN public.workspaces w ON w.id = d.workspace_id
    JOIN public.profiles p ON p.user_id = d.user_id
    WHERE p.school_id = _school_id
      AND p.school_status = 'active'
      AND d.deleted_at IS NULL
      AND d.document_type != 'form_data'
      AND d.status IN ('ready', 'completed')
      AND (_workspace_id IS NULL OR d.workspace_id = _workspace_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.school_documents sd
        WHERE sd.school_id = _school_id AND sd.source_document_id = d.id
      )
  LOOP
    PERFORM public.promote_workspace_doc_to_school_bank(_school_id, v_rec.id, false, 'Ditambahkan massal oleh Waka Kurikulum');
    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('%s dokumen berhasil ditambahkan ke Bank Sekolah', v_inserted_count),
    'count', v_inserted_count
  );
END;
$$;

-- Grant permissions to authenticated
GRANT EXECUTE ON FUNCTION public.get_school_workspace_documents(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_workspace_document_detail(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_workspace_doc_to_school_bank(UUID, UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_promote_workspace_docs_to_school_bank(UUID, UUID) TO authenticated;
