-- Migration: P0 Paket Sekolah — langganan sekolah, kuota kursi guru, gate akses
--
-- Latar belakang (audit USP 2026-10-13):
-- 1. Mode Sekolah sebelumnya pilot-locked (admin + jagofeed@gmail.com). Sekolah yang
--    membayar tidak bisa masuk. Kolom `subscription_expires_at` menjadi kunci pembuka:
--    anggota aktif dari sekolah berlangganan diizinkan masuk (dicek di client via
--    SchoolPilotRoute + SchoolContext; RPC di bawah ini menjaga integritas data).
-- 2. Landing page menjanjikan "manajemen kuota 25 akun guru" tapi tidak ada enforcement.
--    `seat_quota` (tier S=10, M=25, tambah guru = naikkan angka) kini dijaga di 4 jalur
--    masuknya: kode undangan, undangan email (langsung aktif), approval pending, dan
--    auto-claim undangan saat signup.
--
-- Desain:
-- - seat_quota disimpan sebagai satu angka (bukan tier label) agar skema harga bisa
--   berubah (tahunan/semesteran, S/M/custom) tanpa migrasi ulang.
-- - Hanya Admin platform yang boleh mengubah kolom billing (guard trigger), Waka tidak.

-- ============================================================
-- 1. Kolom billing di tabel schools
-- ============================================================
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seat_quota INTEGER NOT NULL DEFAULT 25;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_seat_quota_range'
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_seat_quota_range CHECK (seat_quota BETWEEN 1 AND 500);
  END IF;
END
$$;

-- ============================================================
-- 2. Helper internal (dipakai RPC SECURITY DEFINER di bawah)
-- ============================================================
CREATE OR REPLACE FUNCTION public.count_active_school_members(_school_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::INTEGER
  FROM public.profiles
  WHERE school_id = _school_id
    AND school_status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_school_subscription_active(_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = _school_id
      AND subscription_expires_at IS NOT NULL
      AND subscription_expires_at > now()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.count_active_school_members(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_school_subscription_active(UUID) FROM anon;

-- ============================================================
-- 3. Guard: hanya Admin platform yang boleh mengubah kolom billing.
--    (RLS UPDATE schools mengizinkan waka/kepsek untuk kop & kalender;
--    kolom langganan/kuota harus tetap di luar jangkauan mereka.)
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_protect_school_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at
       OR NEW.seat_quota IS DISTINCT FROM OLD.seat_quota THEN
      RAISE EXCEPTION 'Kolom langganan dan kuota sekolah hanya dapat diubah oleh Admin platform';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schools_protect_billing ON public.schools;
CREATE TRIGGER trg_schools_protect_billing
  BEFORE UPDATE OF subscription_expires_at, seat_quota ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_protect_school_billing();

-- ============================================================
-- 4. join_school_by_code: cek langganan aktif + kuota kursi
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_school_by_code(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school RECORD;
  v_clean_code TEXT;
  v_active_count INTEGER;
  v_already_active BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Harap login terlebih dahulu');
  END IF;

  v_clean_code := upper(trim(_code));

  SELECT id, name, jenjang, seat_quota, subscription_expires_at
  INTO v_school
  FROM public.schools
  WHERE invite_code = v_clean_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode undangan tidak valid atau sudah diganti oleh Waka');
  END IF;

  -- Gate langganan: sekolah yang belum berlangganan / kedaluwarsa tidak menerima anggota
  IF v_school.subscription_expires_at IS NULL OR v_school.subscription_expires_at <= now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Langganan Paket Sekolah belum aktif atau sudah berakhir. Hubungi Waka/Admin platform.'
    );
  END IF;

  -- Re-join idempoten: anggota yang sudah aktif tidak dihitung ulang terhadap kuota
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND school_id = v_school.id AND school_status = 'active'
  ) INTO v_already_active;

  IF NOT v_already_active THEN
    SELECT count(*)::INTEGER INTO v_active_count
    FROM public.profiles
    WHERE school_id = v_school.id AND school_status = 'active';

    IF v_active_count >= COALESCE(v_school.seat_quota, 25) THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Kuota guru sekolah sudah penuh (' || v_active_count || '/' || COALESCE(v_school.seat_quota, 25) ||
                   '). Hubungi Admin untuk menambah kuota (Rp 90.000/guru/tahun).'
      );
    END IF;
  END IF;

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

-- ============================================================
-- 5. add_teacher_by_email: cek langganan aktif + kuota kursi
-- ============================================================
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
  v_school RECORD;
  v_active_count INTEGER;
  v_target_already_active BOOLEAN;
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

  SELECT name, seat_quota, subscription_expires_at
  INTO v_school
  FROM public.schools WHERE id = _school_id;
  v_school_name := v_school.name;

  IF v_school.subscription_expires_at IS NULL OR v_school.subscription_expires_at <= now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Langganan Paket Sekolah belum aktif atau sudah berakhir. Hubungi Admin platform.'
    );
  END IF;

  SELECT user_id INTO v_target_user_id
  FROM public.profiles
  WHERE lower(trim(email)) = v_clean_email
  LIMIT 1;

  IF v_target_user_id IS NOT NULL THEN
    -- Target yang sudah aktif di sekolah ini tidak dihitung ulang terhadap kuota
    SELECT EXISTS(
      SELECT 1 FROM public.profiles
      WHERE user_id = v_target_user_id AND school_id = _school_id AND school_status = 'active'
    ) INTO v_target_already_active;

    IF NOT v_target_already_active THEN
      SELECT count(*)::INTEGER INTO v_active_count
      FROM public.profiles
      WHERE school_id = _school_id AND school_status = 'active';

      IF v_active_count >= COALESCE(v_school.seat_quota, 25) THEN
        RETURN jsonb_build_object(
          'success', false,
          'message', 'Kuota guru sekolah sudah penuh (' || v_active_count || '/' || COALESCE(v_school.seat_quota, 25) ||
                     '). Hubungi Admin untuk menambah kuota (Rp 90.000/guru/tahun).'
        );
      END IF;
    END IF;

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
    -- Pre-whitelist: tolak undangan baru saat kuota penuh supaya tidak menumpuk antrean
    SELECT count(*)::INTEGER INTO v_active_count
    FROM public.profiles
    WHERE school_id = _school_id AND school_status = 'active';

    IF v_active_count >= COALESCE(v_school.seat_quota, 25) THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Kuota guru sekolah sudah penuh (' || v_active_count || '/' || COALESCE(v_school.seat_quota, 25) ||
                   '. Hubungi Admin untuk menambah kuota (Rp 90.000/guru/tahun).'
      );
    END IF;

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

-- ============================================================
-- 6. approve_school_member: cek langganan aktif + kuota kursi
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_school_member(_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_school_id UUID;
  v_school RECORD;
  v_active_count INTEGER;
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

  SELECT seat_quota, subscription_expires_at INTO v_school
  FROM public.schools WHERE id = v_target_school_id;

  IF v_school.subscription_expires_at IS NULL OR v_school.subscription_expires_at <= now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Langganan Paket Sekolah belum aktif atau sudah berakhir. Perpanjang dulu sebelum menyetujui anggota.'
    );
  END IF;

  SELECT count(*)::INTEGER INTO v_active_count
  FROM public.profiles
  WHERE school_id = v_target_school_id
    AND school_status = 'active'
    AND user_id <> _target_user_id;

  IF v_active_count >= COALESCE(v_school.seat_quota, 25) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Kuota guru sekolah sudah penuh (' || v_active_count || '/' || COALESCE(v_school.seat_quota, 25) ||
                 '. Keluarkan anggota atau hubungi Admin untuk menambah kuota.'
    );
  END IF;

  UPDATE public.profiles
  SET school_status = 'active',
      updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Anggota berhasil diaktifkan');
END;
$$;

-- ============================================================
-- 7. Auto-claim undangan (trigger profil): klaim sebagai AKTIF hanya
--    bila langganan aktif dan kuota tersedia; selain itu jadikan PENDING
--    (waka menyetujui manual setelah kuota/langganan tersedia).
-- ============================================================
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
    SELECT si.school_id, s.seat_quota, s.subscription_expires_at
    INTO v_invite
    FROM public.school_invitations si
    JOIN public.schools s ON s.id = si.school_id
    WHERE lower(si.email) = lower(NEW.email)
    LIMIT 1;

    IF FOUND THEN
      NEW.school_id := v_invite.school_id;
      NEW.school_role := 'guru';
      IF v_invite.subscription_expires_at IS NOT NULL
         AND v_invite.subscription_expires_at > now()
         AND public.count_active_school_members(v_invite.school_id) < COALESCE(v_invite.seat_quota, 25) THEN
        NEW.school_status := 'active';
      ELSE
        NEW.school_status := 'pending';
      END IF;
      DELETE FROM public.school_invitations WHERE lower(email) = lower(NEW.email);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
