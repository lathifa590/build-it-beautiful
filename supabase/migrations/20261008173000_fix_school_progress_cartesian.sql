-- ==============================================================
-- Migrasi: Perbaikan Bug Cartesian Product & Sinkronisasi Progres JP Sekolah
-- ==============================================================
-- Masalah sebelumnya:
-- 1. LEFT JOIN bersamaan antara workspaces, meeting_slots, dan documents
--    menimbulkan perkalian silang (Cartesian product).
--    planned_jp terakumulasi dikalikan jumlah dokumen (misal 260 JP jadi 6.840 JP).
-- 2. get_school_progress tidak menghitung completed_jp dari pertemuan yang selesai.
-- 3. Persentase ketuntasan dihitung dengan formula mock (modul / ws*2), bukan rasio JP riil.
-- ==============================================================

-- 1. DROP fungsi lama untuk memperbarui return type
DROP FUNCTION IF EXISTS public.get_school_progress(UUID);
DROP FUNCTION IF EXISTS public.get_school_supervision_report(UUID);

-- 2. CREATE get_school_progress dengan CTE terisolasi
CREATE OR REPLACE FUNCTION public.get_school_progress(_school_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  school_role TEXT,
  workspace_count BIGINT,
  total_planned_jp BIGINT,
  completed_jp BIGINT,
  modul_ready_count BIGINT,
  progress_percent INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Wajib Admin atau anggota sekolah terkait
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.get_auth_school_id() = _school_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_meetings AS (
    -- Agregasi JP dari pertemuan (diisolasi per user agar tidak terjadi perkalian silang)
    SELECT 
      w.user_id,
      COALESCE(SUM(ms.planned_jp), 0)::BIGINT AS total_planned_jp,
      COALESCE(SUM(CASE WHEN ms.status IN ('completed', 'taught') THEN ms.planned_jp ELSE 0 END), 0)::BIGINT AS completed_jp
    FROM public.workspaces w
    JOIN public.meeting_slots ms ON ms.workspace_id = w.id
    GROUP BY w.user_id
  ),
  user_docs AS (
    -- Agregasi dokumen siap pakai (diisolasi per user)
    SELECT 
      w.user_id,
      COUNT(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed') AND d.deleted_at IS NULL)::BIGINT AS modul_ready_count
    FROM public.workspaces w
    JOIN public.documents d ON d.workspace_id = w.id
    GROUP BY w.user_id
  ),
  user_ws_count AS (
    -- Agregasi jumlah workspace
    SELECT 
      w.user_id,
      COUNT(DISTINCT w.id)::BIGINT AS ws_count
    FROM public.workspaces w
    GROUP BY w.user_id
  )
  SELECT
    p.user_id,
    COALESCE(p.display_name, 'Guru')::TEXT AS display_name,
    p.email::TEXT AS email,
    p.avatar_url::TEXT AS avatar_url,
    COALESCE(p.school_role, 'guru')::TEXT AS school_role,
    COALESCE(uwc.ws_count, 0)::BIGINT AS workspace_count,
    COALESCE(um.total_planned_jp, 0)::BIGINT AS total_planned_jp,
    COALESCE(um.completed_jp, 0)::BIGINT AS completed_jp,
    COALESCE(ud.modul_ready_count, 0)::BIGINT AS modul_ready_count,
    CASE 
      WHEN COALESCE(um.total_planned_jp, 0) > 0 THEN 
        LEAST(100, ROUND((COALESCE(um.completed_jp, 0)::NUMERIC / um.total_planned_jp) * 100))::INT
      ELSE 0
    END AS progress_percent
  FROM public.profiles p
  LEFT JOIN user_ws_count uwc ON uwc.user_id = p.user_id
  LEFT JOIN user_meetings um ON um.user_id = p.user_id
  LEFT JOIN user_docs ud ON ud.user_id = p.user_id
  WHERE p.school_id = _school_id 
    AND p.school_status = 'active'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.get_auth_school_role() IN ('waka', 'kepsek')
      OR p.user_id = auth.uid()
    )
  ORDER BY progress_percent DESC, p.display_name ASC;
END;
$$;

-- 3. CREATE get_school_supervision_report dengan CTE terisolasi
CREATE OR REPLACE FUNCTION public.get_school_supervision_report(_school_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  school_role TEXT,
  total_workspaces BIGINT,
  total_jp_planned BIGINT,
  total_jp_completed BIGINT,
  total_modules_ready BIGINT,
  total_shared_to_bank BIGINT,
  total_approved_modules BIGINT,
  compliance_percent INT
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
  WITH user_meetings AS (
    SELECT 
      w.user_id,
      COALESCE(SUM(ms.planned_jp), 0)::BIGINT AS total_planned_jp,
      COALESCE(SUM(CASE WHEN ms.status IN ('completed', 'taught') THEN ms.planned_jp ELSE 0 END), 0)::BIGINT AS completed_jp
    FROM public.workspaces w
    JOIN public.meeting_slots ms ON ms.workspace_id = w.id
    GROUP BY w.user_id
  ),
  user_docs AS (
    SELECT 
      w.user_id,
      COUNT(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed') AND d.deleted_at IS NULL)::BIGINT AS modul_ready_count
    FROM public.workspaces w
    JOIN public.documents d ON d.workspace_id = w.id
    GROUP BY w.user_id
  ),
  user_ws_count AS (
    SELECT 
      w.user_id,
      COUNT(DISTINCT w.id)::BIGINT AS ws_count
    FROM public.workspaces w
    GROUP BY w.user_id
  ),
  user_bank AS (
    SELECT 
      sd.shared_by AS user_id,
      COUNT(DISTINCT sd.id)::BIGINT AS total_shared_to_bank,
      COUNT(DISTINCT sd.id) FILTER (WHERE sd.status = 'approved' OR sd.is_template = true)::BIGINT AS total_approved_modules
    FROM public.school_documents sd
    WHERE sd.school_id = _school_id
    GROUP BY sd.shared_by
  )
  SELECT
    p.user_id,
    COALESCE(p.display_name, 'Guru')::TEXT AS display_name,
    p.email::TEXT AS email,
    COALESCE(p.school_role, 'guru')::TEXT AS school_role,
    COALESCE(uwc.ws_count, 0)::BIGINT AS total_workspaces,
    COALESCE(um.total_planned_jp, 0)::BIGINT AS total_jp_planned,
    COALESCE(um.completed_jp, 0)::BIGINT AS total_jp_completed,
    COALESCE(ud.modul_ready_count, 0)::BIGINT AS total_modules_ready,
    COALESCE(ub.total_shared_to_bank, 0)::BIGINT AS total_shared_to_bank,
    COALESCE(ub.total_approved_modules, 0)::BIGINT AS total_approved_modules,
    CASE 
      WHEN COALESCE(um.total_planned_jp, 0) > 0 THEN 
        LEAST(100, ROUND((COALESCE(um.completed_jp, 0)::NUMERIC / um.total_planned_jp) * 100))::INT
      ELSE 0
    END AS compliance_percent
  FROM public.profiles p
  LEFT JOIN user_ws_count uwc ON uwc.user_id = p.user_id
  LEFT JOIN user_meetings um ON um.user_id = p.user_id
  LEFT JOIN user_docs ud ON ud.user_id = p.user_id
  LEFT JOIN user_bank ub ON ub.user_id = p.user_id
  WHERE p.school_id = _school_id AND p.school_status = 'active'
  ORDER BY compliance_percent DESC, p.display_name ASC;
END;
$$;

-- 4. Permissions (Keamanan Akses)
REVOKE EXECUTE ON FUNCTION public.get_school_progress(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_school_progress(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_school_supervision_report(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_school_supervision_report(UUID) TO authenticated;
