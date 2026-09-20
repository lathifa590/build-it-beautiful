-- Migration: Sistem Undangan Rahasia Sekolah (Invite Code & Direct Email)
-- Menyempurnakan Fase S1: Menggantikan ketergantungan NPSN publik dengan kode undangan rahasia & link WA

-- 1. Tambah kolom invite_code di tabel schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(16) UNIQUE;

-- 2. Fungsi untuk menghasilkan kode unik acak (format: SCH-XXXXXX)
CREATE OR REPLACE FUNCTION public.generate_unique_school_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Format: SCH- + 6 karakter alfanumerik huruf besar
    v_code := 'SCH-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.schools WHERE invite_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 3. Backfill sekolah yang sudah ada agar memiliki invite_code
UPDATE public.schools
SET invite_code = public.generate_unique_school_code()
WHERE invite_code IS NULL;

-- 4. Trigger auto-generate invite_code saat sekolah baru dibuat
CREATE OR REPLACE FUNCTION public.trg_auto_school_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR trim(NEW.invite_code) = '' THEN
    NEW.invite_code := public.generate_unique_school_code();
  ELSE
    NEW.invite_code := upper(trim(NEW.invite_code));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schools_invite_code ON public.schools;
CREATE TRIGGER trg_schools_invite_code
  BEFORE INSERT ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_auto_school_invite_code();


-- 5. Tabel school_invitations untuk pre-whitelist email oleh Waka
CREATE TABLE IF NOT EXISTS public.school_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_school_invitation_email UNIQUE (school_id, email)
);

ALTER TABLE public.school_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Waka and Admin can view school invitations" ON public.school_invitations;
CREATE POLICY "Waka and Admin can view school invitations"
  ON public.school_invitations FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id() 
      AND public.get_auth_school_role() = 'waka'
    )
  );

DROP POLICY IF EXISTS "Waka and Admin can manage school invitations" ON public.school_invitations;
CREATE POLICY "Waka and Admin can manage school invitations"
  ON public.school_invitations FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      school_id = public.get_auth_school_id() 
      AND public.get_auth_school_role() = 'waka'
    )
  );


-- 6. Trigger auto-claim undangan saat profil user baru dibuat / diupdate emailnya
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
      NEW.school_id := v_invite.school_id;
      NEW.school_role := 'guru';
      NEW.school_status := 'active';
      DELETE FROM public.school_invitations WHERE lower(email) = lower(NEW.email);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_school_invite ON public.profiles;
CREATE TRIGGER trg_profile_school_invite
  BEFORE INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_school_invitation();


-- 7. RPC: Regenerasi / Ganti Kode Undangan Baru (Waka / Admin)
CREATE OR REPLACE FUNCTION public.regenerate_school_invite_code(_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_code TEXT;
BEGIN
  -- Validasi akses: Wajib Admin atau Waka dari sekolah tersebut
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.get_auth_school_id() = _school_id
      AND public.get_auth_school_role() = 'waka'
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


-- 8. RPC: Bergabung ke Sekolah via Kode Undangan Rahasia (Langsung Aktif)
CREATE OR REPLACE FUNCTION public.join_school_by_code(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school RECORD;
  v_clean_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  v_clean_code := upper(trim(_code));

  SELECT id, name, jenjang INTO v_school
  FROM public.schools
  WHERE invite_code = v_clean_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode undangan tidak valid atau sudah diganti oleh Waka');
  END IF;

  -- Update profil guru: langsung aktif karena membawa kode rahasia Waka
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


-- 9. RPC: Tambah Guru Langsung via Email oleh Waka / Admin
CREATE OR REPLACE FUNCTION public.add_teacher_by_email(_school_id UUID, _email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_email TEXT;
  v_target_user_id UUID;
  v_school_name TEXT;
BEGIN
  -- Validasi wewenang
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

  -- Cek apakah user dengan email tersebut sudah terdaftar di auth / profiles
  SELECT user_id INTO v_target_user_id
  FROM public.profiles
  WHERE lower(trim(email)) = v_clean_email
  LIMIT 1;

  IF v_target_user_id IS NOT NULL THEN
    -- User sudah punya akun -> langsung sambungkan ke sekolah dan aktifkan
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
    -- User belum mendaftar -> simpan ke daftar pre-whitelist undangan
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


-- 10. RPC: Hapus / Keluarkan Anggota dari Sekolah (Waka / Admin)
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

  -- Waka tidak boleh mengeluarkan sesama waka/admin kecuali jika auth user adalah admin
  IF v_target_role = 'waka' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hanya Admin Utama yang dapat mengeluarkan Waka Kurikulum');
  END IF;

  UPDATE public.profiles
  SET school_id = NULL,
      school_role = 'guru',
      school_status = 'pending',
      updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Anggota berhasil dikeluarkan dari sekolah');
END;
$$;


-- 11. RPC: Batalkan Undangan Email (Waka / Admin)
CREATE OR REPLACE FUNCTION public.cancel_school_invitation(_school_id UUID, _email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.get_auth_school_id() = _school_id
      AND public.get_auth_school_role() = 'waka'
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tidak memiliki wewenang');
  END IF;

  DELETE FROM public.school_invitations
  WHERE school_id = _school_id AND lower(email) = lower(trim(_email));

  RETURN jsonb_build_object('success', true, 'message', 'Undangan dibatalkan');
END;
$$;
