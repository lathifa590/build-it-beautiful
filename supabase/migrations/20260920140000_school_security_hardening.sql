-- Migration: Mode Sekolah — Security Hardening
-- Hasil audit fitur Mode Sekolah (2026-09-20):
--   1. Blokir eskalasi peran: user tidak bisa lagi mengubah kolom school_*
--     pada profiles miliknya sendiri secara langsung (policy
--     "Users can update their own profile" sebelumnya tanpa batasan kolom).
--     Perubahan hanya lewat RPC resmi (yang menyalakan app.school_override)
--     atau oleh Admin.
--   2. RPC get_school_supervision_report & get_school_bank_documents kini
--     wajib anggota sekolah terkait / Admin (sebelumnya bocor antar-sekolah).
--   3. add_teacher_by_email tidak bisa lagi memindahkan guru yang masih
--     terdaftar aktif di sekolah lain.
--   4. join_school_by_code / request_join_school: rate limit 5 percobaan /
--     15 menit, dan tidak lagi menimpa afiliasi aktif di sekolah lain
--     (harus keluar dulu via RPC leave_school).
--   5. Guard kolom kritis tabel schools: non-Admin tidak bisa mengubah
--     npsn / waka_user_id / kepsek_user_id, dan kop terkunci (is_kop_locked)
--     benar-benar dikunci di level DB.
--   6. Kepsek kini juga boleh mengelola kalender sekolah (konsisten dengan
--     hak review dokumen).
--   7. Index & trigger updated_at yang tertinggal.

-- ==============================================================
-- 1. GUARD: kolom afiliasi sekolah di profiles
-- ==============================================================
-- Catatan: trigger BEFORE UPDATE OF (kolom) hanya fire jika kolom tsb ada
-- di SET list, sehingga update kolom lain (display_name, dll) tetap bebas.
-- RPC SECURITY DEFINER tetap berjalan sebagai user yang sama menurut
-- auth.uid(), maka setiap RPC resmi menyalakan flag transaksi-lokal
-- 'app.school_override' sebelum mengubah kolom-kolom ini.

CREATE OR REPLACE FUNCTION public.trg_guard_profile_school_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tidak ada perubahan pada kolom sekolah -> biarkan
  IF NEW.school_id IS NOT DISTINCT FROM OLD.school_id
     AND NEW.school_role IS NOT DISTINCT FROM OLD.school_role
     AND NEW.school_status IS NOT DISTINCT FROM OLD.school_status THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF coalesce(current_setting('app.school_override', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Perubahan afiliasi sekolah hanya dapat dilakukan melalui alur undangan/persetujuan resmi.';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_school_cols ON public.profiles;
CREATE TRIGGER trg_guard_profile_school_cols
  BEFORE UPDATE OF school_id, school_role, school_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_guard_profile_school_columns();


-- ==============================================================
-- 2. GUARD: kolom kritis tabel schools + kop terkunci
-- ==============================================================
CREATE OR REPLACE FUNCTION public.trg_guard_school_critical_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN := public.has_role(auth.uid(), 'admin');
BEGIN
  -- Non-Admin tidak boleh mengubah penunjukan pejabat & identitas NPSN
  IF NOT v_is_admin THEN
    IF NEW.npsn IS DISTINCT FROM OLD.npsn
       OR NEW.waka_user_id IS DISTINCT FROM OLD.waka_user_id
       OR NEW.kepsek_user_id IS DISTINCT FROM OLD.kepsek_user_id
       OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'Hanya Admin yang dapat mengubah penunjukan Waka/Kepsek atau NPSN sekolah.';
    END IF;

    -- Kop resmi terkunci: non-Admin tidak bisa menyentuh kolom kop/pengesahan
    IF OLD.is_kop_locked THEN
      IF NEW.kop_header_text IS DISTINCT FROM OLD.kop_header_text
         OR NEW.kop_sub_text IS DISTINCT FROM OLD.kop_sub_text
         OR NEW.kop_logo_url IS DISTINCT FROM OLD.kop_logo_url
         OR NEW.kepsek_name IS DISTINCT FROM OLD.kepsek_name
         OR NEW.kepsek_nip IS DISTINCT FROM OLD.kepsek_nip
         OR NEW.waka_name IS DISTINCT FROM OLD.waka_name
         OR NEW.waka_nip IS DISTINCT FROM OLD.waka_nip
         OR NEW.titimangsa_kota IS DISTINCT FROM OLD.titimangsa_kota
         OR NEW.is_kop_locked IS DISTINCT FROM OLD.is_kop_locked THEN
        RAISE EXCEPTION 'Kop & pengesahan sekolah sudah dikunci. Hubungi Admin untuk membuka kunci.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_school_critical_cols ON public.schools;
CREATE TRIGGER trg_guard_school_critical_cols
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_guard_school_critical_columns();


-- ==============================================================
-- 3. Rate limit percobaan gabung sekolah (anti brute-force kode undangan)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.school_join_attempts (
  user_id UUID NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_join_attempts_lookup
  ON public.school_join_attempts(user_id, attempted_at);

ALTER TABLE public.school_join_attempts ENABLE ROW LEVEL SECURITY;
-- Tidak ada policy: hanya diakses lewat RPC SECURITY DEFINER di bawah.

-- Helper bersama untuk cek & catat percobaan
CREATE OR REPLACE FUNCTION public.check_and_log_join_attempt()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent INTEGER;
BEGIN
  DELETE FROM public.school_join_attempts
  WHERE user_id = auth.uid()
    AND attempted_at < now() - INTERVAL '15 minutes';

  SELECT count(*) INTO v_recent
  FROM public.school_join_attempts
  WHERE user_id = auth.uid();

  INSERT INTO public.school_join_attempts (user_id) VALUES (auth.uid());

  RETURN v_recent < 5;
END;
$$;


-- ==============================================================
-- 4. Rebuild RPC gabung sekolah: override flag + rate limit + anti-timpa
-- ==============================================================
CREATE OR REPLACE FUNCTION public.request_join_school(_npsn TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school RECORD;
  v_current_school_id UUID;
  v_current_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  IF NOT public.check_and_log_join_attempt() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.');
  END IF;

  SELECT school_id, school_status INTO v_current_school_id, v_current_status
  FROM public.profiles WHERE user_id = auth.uid();

  IF v_current_status = 'active' AND v_current_school_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Anda masih terdaftar aktif di sekolah lain. Keluar dari sekolah saat ini terlebih dahulu.');
  END IF;

  SELECT id, name INTO v_school FROM public.schools WHERE npsn = trim(_npsn);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sekolah dengan NPSN tersebut tidak ditemukan');
  END IF;

  PERFORM set_config('app.school_override', 'on', true);

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


CREATE OR REPLACE FUNCTION public.join_school_by_code(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school RECORD;
  v_clean_code TEXT;
  v_current_school_id UUID;
  v_current_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  IF NOT public.check_and_log_join_attempt() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.');
  END IF;

  SELECT school_id, school_status INTO v_current_school_id, v_current_status
  FROM public.profiles WHERE user_id = auth.uid();

  IF v_current_status = 'active' AND v_current_school_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Anda masih terdaftar aktif di sekolah lain. Keluar dari sekolah saat ini terlebih dahulu.');
  END IF;

  v_clean_code := upper(trim(_code));

  SELECT id, name, jenjang INTO v_school
  FROM public.schools
  WHERE invite_code = v_clean_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode undangan tidak valid atau sudah diganti oleh Waka');
  END IF;

  PERFORM set_config('app.school_override', 'on', true);

  UPDATE public.profiles
  SET school_id = v_school.id,
      school_role = 'guru',
      school_status = 'active',
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object(
    'success', true,
    'school_id', v_school.id,
    'school_name', v_school.name,
    'message', 'Selamat! Anda berhasil bergabung dengan ' || v_school.name
  );
END;
$$;


-- RPC baru: guru keluar sendiri dari sekolahnya (prasyarat pindah sekolah)
CREATE OR REPLACE FUNCTION public.leave_school()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_school_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  SELECT school_id, school_role INTO v_school_id, v_role
  FROM public.profiles WHERE user_id = auth.uid();

  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Anda belum tergabung di sekolah manapun');
  END IF;

  IF v_role = 'waka' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Waka Kurikulum tidak dapat keluar sendiri. Hubungi Admin Utama.');
  END IF;

  PERFORM set_config('app.school_override', 'on', true);

  UPDATE public.profiles
  SET school_id = NULL,
      school_role = 'guru',
      school_status = 'pending',
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object('success', true, 'message', 'Anda telah keluar dari sekolah');
END;
$$;


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

  PERFORM set_config('app.school_override', 'on', true);

  UPDATE public.profiles
  SET school_status = 'active',
      updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Anggota berhasil diaktifkan');
END;
$$;


CREATE OR REPLACE FUNCTION public.remove_school_member(_school_id UUID, _target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_role TEXT;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.get_auth_school_id() = _school_id
      AND public.get_auth_school_role() = 'waka'
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tidak memiliki wewenang untuk mengeluarkan anggota');
  END IF;

  SELECT school_role INTO v_target_role
  FROM public.profiles
  WHERE user_id = _target_user_id AND school_id = _school_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Anggota tidak ditemukan pada sekolah ini');
  END IF;

  IF v_target_role = 'waka' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hanya Admin Utama yang dapat mengeluarkan Waka Kurikulum');
  END IF;

  PERFORM set_config('app.school_override', 'on', true);

  UPDATE public.profiles
  SET school_id = NULL,
      school_role = 'guru',
      school_status = 'pending',
      updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Anggota berhasil dikeluarkan dari sekolah');
END;
$$;


CREATE OR REPLACE FUNCTION public.add_teacher_by_email(_school_id UUID, _email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_email TEXT;
  v_target_user_id UUID;
  v_target_school_id UUID;
  v_school_name TEXT;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.get_auth_school_id() = _school_id
      AND public.get_auth_school_role() = 'waka'
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tidak memiliki wewenang untuk menambahkan guru');
  END IF;

  v_clean_email := lower(trim(_email));
  IF v_clean_email = '' OR v_clean_email NOT LIKE '%@%.%' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Format email tidak valid');
  END IF;

  SELECT name INTO v_school_name FROM public.schools WHERE id = _school_id;

  SELECT user_id, school_id INTO v_target_user_id, v_target_school_id
  FROM public.profiles
  WHERE lower(trim(email)) = v_clean_email
  LIMIT 1;

  IF v_target_user_id IS NOT NULL THEN
    -- Anti-curi anggota: guru yang masih terdaftar di sekolah lain tidak boleh dipindahkan diam-diam
    IF v_target_school_id IS NOT NULL AND v_target_school_id != _school_id THEN
      RETURN jsonb_build_object('success', false, 'message', 'Guru dengan email tersebut masih terdaftar di sekolah lain. Ia harus keluar dari sekolah sebelumnya terlebih dahulu.');
    END IF;

    PERFORM set_config('app.school_override', 'on', true);

    UPDATE public.profiles
    SET school_id = _school_id,
        school_role = 'guru',
        school_status = 'active',
        updated_at = now()
    WHERE user_id = v_target_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'activated',
      'message', 'Guru dengan email ' || v_clean_email || ' berhasil diaktifkan di ' || v_school_name
    );
  ELSE
    INSERT INTO public.school_invitations (school_id, email, invited_by)
    VALUES (_school_id, v_clean_email, auth.uid())
    ON CONFLICT (school_id, email) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'invited',
      'message', 'Email ' || v_clean_email || ' masuk ke daftar undangan. Begitu mendaftar/login, akunnya akan otomatis terhubung.'
    );
  END IF;
END;
$$;


-- ==============================================================
-- 5. Trigger undangan: hapus undangan terbatas pada sekolah terkait
--    dan nyalakan override flag
-- ==============================================================
CREATE OR REPLACE FUNCTION public.trg_check_school_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  IF NEW.email IS NOT NULL AND (NEW.school_id IS NULL OR NEW.school_status != 'active') THEN
    SELECT school_id INTO v_invite
    FROM public.school_invitations
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF FOUND THEN
      PERFORM set_config('app.school_override', 'on', true);
      NEW.school_id := v_invite.school_id;
      NEW.school_role := 'guru';
      NEW.school_status := 'active';
      DELETE FROM public.school_invitations
      WHERE school_id = v_invite.school_id
        AND lower(email) = lower(NEW.email);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


-- ==============================================================
-- 6. AUTH GUARD: RPC rekap & bank dokumen (tutup kebocoran antar-sekolah)
-- ==============================================================
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


-- ==============================================================
-- 7. Kepsek juga boleh mengelola kalender sekolah
-- ==============================================================
DROP POLICY IF EXISTS "Waka or Admin can manage school calendars" ON public.school_calendars;
CREATE POLICY "Waka Kepsek or Admin can manage school calendars"
  ON public.school_calendars FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id() 
      AND public.get_auth_school_role() IN ('waka', 'kepsek')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id() 
      AND public.get_auth_school_role() IN ('waka', 'kepsek')
    )
  );


-- ==============================================================
-- 8. Index & trigger yang tertinggal
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_school_docs_workspace ON public.school_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_school_docs_source_doc ON public.school_documents(source_document_id);
CREATE INDEX IF NOT EXISTS idx_school_docs_shared_by ON public.school_documents(shared_by);

DROP TRIGGER IF EXISTS update_school_documents_updated_at ON public.school_documents;
CREATE TRIGGER update_school_documents_updated_at
  BEFORE UPDATE ON public.school_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ==============================================================
-- 9. Pastikan fungsi regenerasi & pembatalan undangan ada & aman
-- ==============================================================
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(16) UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_unique_school_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'SCH-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.schools WHERE invite_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_school_invite_code(_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_code TEXT;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.get_auth_school_id() = _school_id
      AND public.get_auth_school_role() IN ('waka', 'kepsek')
    )
  ) THEN
    RAISE EXCEPTION 'Tidak memiliki hak akses untuk mengubah kode undangan sekolah';
  END IF;

  v_new_code := public.generate_unique_school_code();

  UPDATE public.schools
  SET invite_code = v_new_code,
      updated_at = now()
  WHERE id = _school_id;

  RETURN v_new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_school_invitation(_school_id UUID, _email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.get_auth_school_id() = _school_id
      AND public.get_auth_school_role() IN ('waka', 'kepsek')
    )
  ) THEN
    RAISE EXCEPTION 'Tidak memiliki wewenang untuk membatalkan undangan';
  END IF;

  DELETE FROM public.school_invitations
  WHERE school_id = _school_id AND lower(trim(email)) = lower(trim(_email));

  RETURN true;
END;
$$;


-- ==============================================================
-- 10. Batasi eksekusi RPC sekolah hanya untuk user terautentikasi (Aman & Idempoten)
-- ==============================================================
DO $$
DECLARE
  r RECORD;
  v_funcs TEXT[] := ARRAY[
    'request_join_school',
    'join_school_by_code',
    'leave_school',
    'approve_school_member',
    'remove_school_member',
    'add_teacher_by_email',
    'regenerate_school_invite_code',
    'cancel_school_invitation',
    'share_document_to_school',
    'review_school_document',
    'get_school_progress',
    'get_school_bank_documents',
    'get_school_supervision_report'
  ];
  v_name TEXT;
BEGIN
  FOREACH v_name IN ARRAY v_funcs LOOP
    FOR r IN
      SELECT p.oid::regprocedure AS proc_sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = v_name
    LOOP
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.proc_sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.proc_sig);
    END LOOP;
  END LOOP;
END;
$$;
