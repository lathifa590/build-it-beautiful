-- Migration: Mode Sekolah Fase S3 (Governance, Kop Resmi, Pengesahan & Rekap Supervisi Dinas)
-- Melengkapi tata kelola sekolah, pengesahan Kepala Sekolah, dan laporan supervisi akreditasi.

-- 1. Tambah kolom governance di tabel schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS kop_header_text TEXT,
  ADD COLUMN IF NOT EXISTS kop_sub_text TEXT,
  ADD COLUMN IF NOT EXISTS kop_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS kepsek_name TEXT,
  ADD COLUMN IF NOT EXISTS kepsek_nip TEXT,
  ADD COLUMN IF NOT EXISTS waka_name TEXT,
  ADD COLUMN IF NOT EXISTS waka_nip TEXT,
  ADD COLUMN IF NOT EXISTS titimangsa_kota TEXT DEFAULT 'Kota Setempat',
  ADD COLUMN IF NOT EXISTS is_kop_locked BOOLEAN DEFAULT false;


-- 2. RPC Rekap Supervisi / Akreditasi Dinas (Supervision Compliance Report)
CREATE OR REPLACE FUNCTION public.get_school_supervision_report(_school_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  school_role TEXT,
  total_workspaces BIGINT,
  total_jp_planned BIGINT,
  total_modules_ready BIGINT,
  total_shared_to_bank BIGINT,
  total_approved_modules BIGINT,
  compliance_percent INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    COALESCE(p.display_name, 'Guru')::TEXT AS display_name,
    p.email::TEXT AS email,
    COALESCE(p.school_role, 'guru')::TEXT AS school_role,
    COUNT(DISTINCT w.id) AS total_workspaces,
    COALESCE(SUM(ms.planned_jp), 0)::BIGINT AS total_jp_planned,
    COUNT(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed')) AS total_modules_ready,
    COUNT(DISTINCT sd.id) AS total_shared_to_bank,
    COUNT(DISTINCT sd.id) FILTER (WHERE sd.status = 'approved' OR sd.is_template = true) AS total_approved_modules,
    CASE 
      WHEN COUNT(DISTINCT w.id) = 0 THEN 0
      ELSE LEAST(100, ROUND((COUNT(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed'))::NUMERIC / GREATEST(1, COUNT(DISTINCT w.id) * 2)) * 100))::INT
    END AS compliance_percent
  FROM public.profiles p
  LEFT JOIN public.workspaces w ON w.user_id = p.user_id
  LEFT JOIN public.meeting_slots ms ON ms.workspace_id = w.id
  LEFT JOIN public.documents d ON d.workspace_id = w.id
  LEFT JOIN public.school_documents sd ON sd.shared_by = p.user_id AND sd.school_id = _school_id
  WHERE p.school_id = _school_id AND p.school_status = 'active'
  GROUP BY p.user_id, p.display_name, p.email, p.school_role
  ORDER BY compliance_percent DESC, p.display_name ASC;
END;
$$;
