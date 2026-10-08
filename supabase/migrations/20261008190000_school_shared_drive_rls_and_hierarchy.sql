-- ==============================================================
-- Migrasi: Shared Drive Sekolah & Hierarki 3 Level Bank Modul
-- ==============================================================
-- 1. Helper function is_same_school_member
-- 2. RLS Policies SELECT untuk dewan guru & waka dalam satu sekolah
-- 3. RPC get_school_shared_workspaces (Level 1: Folder Mapel/Guru)
-- 4. RPC get_school_workspace_meetings (Level 2: Daftar Pertemuan)
-- 5. RPC get_school_meeting_full_detail (Level 3: Viewer Utuh Pertemuan)
-- ==============================================================

-- 1. Helper Function
CREATE OR REPLACE FUNCTION public.is_same_school_member(_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles viewer
    JOIN public.profiles owner ON owner.user_id = _owner_id
    WHERE viewer.user_id = auth.uid()
      AND viewer.school_status = 'active'
      AND owner.school_status = 'active'
      AND viewer.school_id IS NOT NULL
      AND viewer.school_id = owner.school_id
  );
$$;

-- 2. RLS Policies (Read-Only access for same-school members)
DROP POLICY IF EXISTS "School members can view school workspaces" ON public.workspaces;
CREATE POLICY "School members can view school workspaces" ON public.workspaces
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_same_school_member(user_id)
  );

DROP POLICY IF EXISTS "School members can view curriculum plans" ON public.curriculum_plans;
CREATE POLICY "School members can view curriculum plans" ON public.curriculum_plans
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = curriculum_plans.workspace_id
        AND public.is_same_school_member(w.user_id)
    )
  );

DROP POLICY IF EXISTS "School members can view prosem items" ON public.prosem_items;
CREATE POLICY "School members can view prosem items" ON public.prosem_items
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = prosem_items.workspace_id
        AND public.is_same_school_member(w.user_id)
    )
  );

DROP POLICY IF EXISTS "School members can view meeting slots" ON public.meeting_slots;
CREATE POLICY "School members can view meeting slots" ON public.meeting_slots
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = meeting_slots.workspace_id
        AND public.is_same_school_member(w.user_id)
    )
  );

DROP POLICY IF EXISTS "School members can view meeting document links" ON public.meeting_document_links;
CREATE POLICY "School members can view meeting document links" ON public.meeting_document_links
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.meeting_slots ms
      JOIN public.workspaces w ON w.id = ms.workspace_id
      WHERE ms.id = meeting_document_links.meeting_slot_id
        AND public.is_same_school_member(w.user_id)
    )
  );

DROP POLICY IF EXISTS "School members can view school documents" ON public.documents;
CREATE POLICY "School members can view school documents" ON public.documents
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_same_school_member(user_id)
  );

DROP POLICY IF EXISTS "School members can view document versions" ON public.document_versions;
CREATE POLICY "School members can view document versions" ON public.document_versions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_versions.document_id
        AND public.is_same_school_member(d.user_id)
    )
  );

-- 3. RPC get_school_shared_workspaces (Level 1)
CREATE OR REPLACE FUNCTION public.get_school_shared_workspaces(
  _school_id UUID,
  _teacher_id UUID DEFAULT NULL,
  _subject TEXT DEFAULT NULL,
  _search TEXT DEFAULT NULL
)
RETURNS TABLE (
  workspace_id UUID,
  subject TEXT,
  grade TEXT,
  phase TEXT,
  academic_year TEXT,
  user_id UUID,
  teacher_name TEXT,
  teacher_email TEXT,
  teacher_avatar TEXT,
  teacher_role TEXT,
  total_meetings BIGINT,
  total_planned_jp BIGINT,
  completed_jp BIGINT,
  completed_meetings BIGINT,
  ready_docs BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.get_auth_school_id() = _school_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH ws_slots AS (
    SELECT
      ms.workspace_id,
      COUNT(ms.id)::BIGINT AS total_meetings,
      COALESCE(SUM(ms.planned_jp), 0)::BIGINT AS total_planned_jp,
      COALESCE(SUM(CASE WHEN ms.status IN ('completed', 'taught') THEN ms.planned_jp ELSE 0 END), 0)::BIGINT AS completed_jp,
      COUNT(ms.id) FILTER (WHERE ms.status IN ('completed', 'taught'))::BIGINT AS completed_meetings
    FROM public.meeting_slots ms
    GROUP BY ms.workspace_id
  ),
  ws_docs AS (
    SELECT
      d.workspace_id,
      COUNT(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed') AND d.document_type != 'form_data')::BIGINT AS ready_docs
    FROM public.documents d
    WHERE d.deleted_at IS NULL
    GROUP BY d.workspace_id
  )
  SELECT
    w.id AS workspace_id,
    w.subject,
    w.grade,
    w.phase,
    w.academic_year,
    w.user_id,
    COALESCE(p.display_name, 'Guru') AS teacher_name,
    COALESCE(p.email, '') AS teacher_email,
    p.avatar_url AS teacher_avatar,
    COALESCE(p.school_role, 'guru') AS teacher_role,
    COALESCE(s.total_meetings, 0) AS total_meetings,
    COALESCE(s.total_planned_jp, 0) AS total_planned_jp,
    COALESCE(s.completed_jp, 0) AS completed_jp,
    COALESCE(s.completed_meetings, 0) AS completed_meetings,
    COALESCE(d.ready_docs, 0) AS ready_docs,
    w.created_at
  FROM public.workspaces w
  JOIN public.profiles p ON p.user_id = w.user_id
  LEFT JOIN ws_slots s ON s.workspace_id = w.id
  LEFT JOIN ws_docs d ON d.workspace_id = w.id
  WHERE p.school_id = _school_id
    AND p.school_status = 'active'
    AND (w.is_archived IS NULL OR w.is_archived = false)
    AND (_teacher_id IS NULL OR w.user_id = _teacher_id)
    AND (_subject IS NULL OR _subject = 'all' OR w.subject ILIKE '%' || _subject || '%')
    AND (
      _search IS NULL OR _search = ''
      OR w.subject ILIKE '%' || _search || '%'
      OR p.display_name ILIKE '%' || _search || '%'
      OR w.grade ILIKE '%' || _search || '%'
    )
  ORDER BY w.created_at DESC;
END;
$$;

-- 4. RPC get_school_workspace_meetings (Level 2)
CREATE OR REPLACE FUNCTION public.get_school_workspace_meetings(
  _school_id UUID,
  _workspace_id UUID
)
RETURNS TABLE (
  meeting_id UUID,
  workspace_id UUID,
  sequence INT,
  title TEXT,
  planned_jp INT,
  status TEXT,
  has_modul BOOLEAN,
  has_lkpd BOOLEAN,
  has_asesmen BOOLEAN,
  has_soal BOOLEAN,
  has_materi BOOLEAN,
  has_refleksi BOOLEAN,
  completed_docs_count INT,
  materi_pokok TEXT,
  is_in_school_bank BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.get_auth_school_id() = _school_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH meeting_docs AS (
    SELECT
      mdl.meeting_slot_id,
      BOOL_OR(d.document_type = 'modul' AND d.status IN ('ready', 'completed')) AS has_modul,
      BOOL_OR(d.document_type = 'lkpd' AND d.status IN ('ready', 'completed')) AS has_lkpd,
      BOOL_OR(d.document_type = 'asesmen' AND d.status IN ('ready', 'completed')) AS has_asesmen,
      BOOL_OR(d.document_type = 'soal' AND d.status IN ('ready', 'completed')) AS has_soal,
      BOOL_OR(d.document_type = 'materi' AND d.status IN ('ready', 'completed')) AS has_materi,
      BOOL_OR(d.document_type = 'refleksi' AND d.status IN ('ready', 'completed')) AS has_refleksi,
      COUNT(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed') AND d.document_type != 'form_data')::INT AS completed_docs_count
    FROM public.meeting_document_links mdl
    JOIN public.documents d ON d.id = mdl.document_id
    WHERE d.deleted_at IS NULL
    GROUP BY mdl.meeting_slot_id
  )
  SELECT
    ms.id AS meeting_id,
    ms.workspace_id,
    ms.sequence,
    ms.title,
    ms.planned_jp,
    ms.status,
    COALESCE(md.has_modul, false) AS has_modul,
    COALESCE(md.has_lkpd, false) AS has_lkpd,
    COALESCE(md.has_asesmen, false) AS has_asesmen,
    COALESCE(md.has_soal, false) AS has_soal,
    COALESCE(md.has_materi, false) AS has_materi,
    COALESCE(md.has_refleksi, false) AS has_refleksi,
    COALESCE(md.completed_docs_count, 0) AS completed_docs_count,
    COALESCE(pi.materi_pokok, '') AS materi_pokok,
    EXISTS (
      SELECT 1 FROM public.school_documents sd
      WHERE sd.school_id = _school_id
        AND sd.workspace_id = _workspace_id
        AND sd.title ILIKE '%' || ms.title || '%'
    ) AS is_in_school_bank
  FROM public.meeting_slots ms
  JOIN public.workspaces w ON w.id = ms.workspace_id
  JOIN public.profiles p ON p.user_id = w.user_id
  LEFT JOIN public.prosem_items pi ON pi.id = ms.prosem_item_id
  LEFT JOIN meeting_docs md ON md.meeting_slot_id = ms.id
  WHERE ms.workspace_id = _workspace_id
    AND p.school_id = _school_id
    AND p.school_status = 'active'
  ORDER BY ms.sequence ASC;
END;
$$;

-- 5. RPC get_school_meeting_full_detail (Level 3)
CREATE OR REPLACE FUNCTION public.get_school_meeting_full_detail(
  _school_id UUID,
  _meeting_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ms RECORD;
  v_ws RECORD;
  v_docs JSONB;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.get_auth_school_id() = _school_id
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- 1. Meeting Slot
  SELECT ms.*, pi.materi_pokok, pi.tp_snapshot
  INTO v_ms
  FROM public.meeting_slots ms
  LEFT JOIN public.prosem_items pi ON pi.id = ms.prosem_item_id
  WHERE ms.id = _meeting_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Pertemuan tidak ditemukan');
  END IF;

  -- 2. Workspace
  SELECT w.*, p.display_name AS teacher_name, p.email AS teacher_email, p.school_role AS teacher_role
  INTO v_ws
  FROM public.workspaces w
  JOIN public.profiles p ON p.user_id = w.user_id
  WHERE w.id = v_ms.workspace_id
    AND p.school_id = _school_id
    AND p.school_status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Workspace tidak ditemukan atau tidak berada di sekolah ini');
  END IF;

  -- 3. Dokumen 6 komponen beserta content_json
  WITH doc_versions AS (
    SELECT
      d.document_type,
      d.title,
      d.status,
      d.id AS document_id,
      COALESCE(
        dv_curr.content_json,
        dv_latest.content_json,
        '{}'::jsonb
      ) AS content_json
    FROM public.meeting_document_links mdl
    JOIN public.documents d ON d.id = mdl.document_id
    LEFT JOIN public.document_versions dv_curr ON dv_curr.id = d.current_version_id
    LEFT JOIN LATERAL (
      SELECT content_json
      FROM public.document_versions
      WHERE document_id = d.id
      ORDER BY version_number DESC
      LIMIT 1
    ) dv_latest ON true
    WHERE mdl.meeting_slot_id = _meeting_id
      AND d.deleted_at IS NULL
  )
  SELECT jsonb_object_agg(
    document_type,
    jsonb_build_object(
      'document_id', document_id,
      'title', title,
      'status', status,
      'content_json', content_json
    )
  ) INTO v_docs
  FROM doc_versions;

  RETURN jsonb_build_object(
    'meeting', jsonb_build_object(
      'id', v_ms.id,
      'workspace_id', v_ms.workspace_id,
      'sequence', v_ms.sequence,
      'title', v_ms.title,
      'planned_jp', v_ms.planned_jp,
      'status', v_ms.status,
      'materi_pokok', v_ms.materi_pokok,
      'tp_snapshot', v_ms.tp_snapshot
    ),
    'workspace', jsonb_build_object(
      'id', v_ws.id,
      'subject', v_ws.subject,
      'grade', v_ws.grade,
      'phase', v_ws.phase,
      'academic_year', v_ws.academic_year,
      'teacher_id', v_ws.user_id,
      'teacher_name', v_ws.teacher_name,
      'teacher_email', v_ws.teacher_email,
      'teacher_role', v_ws.teacher_role,
      'jp_duration_minutes', v_ws.jp_duration_minutes
    ),
    'documents', COALESCE(v_docs, '{}'::jsonb)
  );
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.is_same_school_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_shared_workspaces(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_workspace_meetings(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_meeting_full_detail(UUID, UUID) TO authenticated;
