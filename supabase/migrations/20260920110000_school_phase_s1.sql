-- Migration for ModulAjar Sekolah (Fase S1: Fondasi & Kalender Warisan)
-- Berdasarkan blueprint map.md:
-- 1. schools (entitas sekolah / tenant)
-- 2. school_calendars (kalender pendidikan sekolah per tahun ajaran & semester)
-- 3. Alter profiles (school_id, school_role, school_status)
-- 4. RLS policies & helper functions
-- 5. RPC get_school_progress, request_join_school, approve_school_member

-- 1. Create schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npsn VARCHAR(12) UNIQUE,
    name TEXT NOT NULL,
    jenjang TEXT CHECK (jenjang IN ('SD', 'SMP', 'SMA', 'SMK', 'MA', 'MI', 'MTS', 'PAUD', 'TK', 'SLB')),
    alamat TEXT,
    waka_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    kepsek_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    academic_year_active TEXT DEFAULT '2024/2025',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_schools_npsn ON public.schools(npsn);
CREATE INDEX IF NOT EXISTS idx_schools_waka ON public.schools(waka_user_id);
CREATE INDEX IF NOT EXISTS idx_schools_kepsek ON public.schools(kepsek_user_id);


-- 2. Create school_calendars table
CREATE TABLE IF NOT EXISTS public.school_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    pekan_efektif INTEGER NOT NULL DEFAULT 18 CHECK (pekan_efektif > 0),
    kalender_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    jp_duration_minutes INTEGER DEFAULT 45 CHECK (jp_duration_minutes > 0),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_calendars_period UNIQUE (school_id, academic_year, semester)
);

CREATE TRIGGER update_school_calendars_updated_at
  BEFORE UPDATE ON public.school_calendars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_school_calendars_lookup ON public.school_calendars(school_id, academic_year, semester);


-- 3. Alter profiles table (1 sekolah per user)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS school_role TEXT CHECK (school_role IN ('guru', 'waka', 'kepsek')),
  ADD COLUMN IF NOT EXISTS school_status TEXT CHECK (school_status IN ('pending', 'active', 'rejected')) DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_role ON public.profiles(school_id, school_role, school_status);


-- 4. Helper Security Definer Functions (mencegah rekursi RLS)
CREATE OR REPLACE FUNCTION public.get_auth_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles 
  WHERE user_id = auth.uid() AND school_status = 'active' 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_school_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_role FROM public.profiles 
  WHERE user_id = auth.uid() AND school_status = 'active' 
  LIMIT 1;
$$;


-- 5. RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members and admins can view schools" ON public.schools;
CREATE POLICY "Members and admins can view schools"
  ON public.schools FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR id = public.get_auth_school_id()
    OR id IN (SELECT p.school_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin can insert schools" ON public.schools;
CREATE POLICY "Admin can insert schools"
  ON public.schools FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Waka, Kepsek, and Admin can update school" ON public.schools;
CREATE POLICY "Waka, Kepsek, and Admin can update school"
  ON public.schools FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR waka_user_id = auth.uid()
    OR kepsek_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin can delete schools" ON public.schools;
CREATE POLICY "Admin can delete schools"
  ON public.schools FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


-- 6. RLS on school_calendars
ALTER TABLE public.school_calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view school calendars" ON public.school_calendars;
CREATE POLICY "Members can view school calendars"
  ON public.school_calendars FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR school_id = public.get_auth_school_id()
  );

DROP POLICY IF EXISTS "Waka or Admin can manage school calendars" ON public.school_calendars;
CREATE POLICY "Waka or Admin can manage school calendars"
  ON public.school_calendars FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id() 
      AND public.get_auth_school_role() = 'waka'
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id() 
      AND public.get_auth_school_role() = 'waka'
    )
  );


-- 7. Policy tambahan untuk profiles (agar sesama anggota sekolah bisa melihat nama rekan di dashboard)
DROP POLICY IF EXISTS "Members can view same school profiles" ON public.profiles;
CREATE POLICY "Members can view same school profiles"
  ON public.profiles FOR SELECT
  USING (
    school_id IS NOT NULL 
    AND school_id = public.get_auth_school_id()
  );


-- 8. RPC: get_school_progress (SECURITY DEFINER)
-- Agregasi progress guru di sekolah tertentu untuk dashboard Waka/Kepsek
CREATE OR REPLACE FUNCTION public.get_school_progress(_school_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  school_role TEXT,
  workspace_count BIGINT,
  total_planned_jp BIGINT,
  modul_ready_count BIGINT
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

  -- Jika guru reguler, hanya return data miliknya sendiri
  IF NOT public.has_role(auth.uid(), 'admin') AND public.get_auth_school_role() NOT IN ('waka', 'kepsek') THEN
    RETURN QUERY
    SELECT
      p.user_id,
      p.display_name,
      p.email,
      p.avatar_url,
      p.school_role,
      count(DISTINCT w.id)::BIGINT AS workspace_count,
      coalesce(sum(ms.planned_jp), 0)::BIGINT AS total_planned_jp,
      count(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed'))::BIGINT AS modul_ready_count
    FROM public.profiles p
    LEFT JOIN public.workspaces w ON w.user_id = p.user_id
    LEFT JOIN public.meeting_slots ms ON ms.workspace_id = w.id
    LEFT JOIN public.documents d ON d.workspace_id = w.id
    WHERE p.school_id = _school_id 
      AND p.school_status = 'active'
      AND p.user_id = auth.uid()
    GROUP BY p.user_id, p.display_name, p.email, p.avatar_url, p.school_role;
    RETURN;
  END IF;

  -- Waka, Kepsek, dan Admin dapat melihat seluruh guru di sekolah tersebut
  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.email,
    p.avatar_url,
    p.school_role,
    count(DISTINCT w.id)::BIGINT AS workspace_count,
    coalesce(sum(ms.planned_jp), 0)::BIGINT AS total_planned_jp,
    count(DISTINCT d.id) FILTER (WHERE d.status IN ('ready', 'completed'))::BIGINT AS modul_ready_count
  FROM public.profiles p
  LEFT JOIN public.workspaces w ON w.user_id = p.user_id
  LEFT JOIN public.meeting_slots ms ON ms.workspace_id = w.id
  LEFT JOIN public.documents d ON d.workspace_id = w.id
  WHERE p.school_id = _school_id 
    AND p.school_status = 'active'
  GROUP BY p.user_id, p.display_name, p.email, p.avatar_url, p.school_role
  ORDER BY p.display_name ASC;
END;
$$;


-- 9. RPC: request_join_school (Guru mengajukan gabung via NPSN)
CREATE OR REPLACE FUNCTION public.request_join_school(_npsn TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  SELECT id, name INTO v_school FROM public.schools WHERE npsn = trim(_npsn);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sekolah dengan NPSN tersebut tidak ditemukan');
  END IF;

  UPDATE public.profiles
  SET school_id = v_school.id,
      school_role = 'guru',
      school_status = 'pending',
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object(
    'success', true, 
    'school_id', v_school.id, 
    'school_name', v_school.name,
    'message', 'Permintaan bergabung berhasil diajukan dan menunggu persetujuan Waka/Admin'
  );
END;
$$;


-- 10. RPC: approve_school_member (Waka/Admin menyetujui anggota pending)
CREATE OR REPLACE FUNCTION public.approve_school_member(_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_school_id UUID;
BEGIN
  SELECT school_id INTO v_target_school_id FROM public.profiles WHERE user_id = _target_user_id;
  IF v_target_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pengguna belum terdaftar di sekolah manapun');
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.get_auth_school_id() = v_target_school_id
      AND public.get_auth_school_role() = 'waka'
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tidak memiliki wewenang untuk menyetujui anggota');
  END IF;

  UPDATE public.profiles
  SET school_status = 'active',
      updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Anggota berhasil diaktifkan');
END;
$$;
