-- ============================================================================
-- MIGRATION: Affiliate Program System (Komisi 40%, Trial via Affiliate API Key,
--            Leaderboard, Payouts, and Marketing Kit)
-- ============================================================================

-- 1. Table: affiliate_settings (Global settings editable by Admin)
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_commission_rate NUMERIC NOT NULL DEFAULT 40,
  min_payout_free_fee NUMERIC NOT NULL DEFAULT 50000,
  below_min_admin_fee NUMERIC NOT NULL DEFAULT 2500,
  trial_quota_per_user INTEGER NOT NULL DEFAULT 25,
  max_trials_per_month INTEGER NOT NULL DEFAULT 30,
  is_program_active BOOLEAN NOT NULL DEFAULT true,
  leaderboard_period_title TEXT NOT NULL DEFAULT 'Top 5 Afiliator Bulan Ini',
  leaderboard_start_date TIMESTAMPTZ,
  leaderboard_end_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.affiliate_settings TO anon, authenticated;
GRANT ALL ON public.affiliate_settings TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can read affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Anyone can read affiliate settings" ON public.affiliate_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Admins can manage affiliate settings" ON public.affiliate_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

INSERT INTO public.affiliate_settings (
  default_commission_rate,
  min_payout_free_fee,
  below_min_admin_fee,
  trial_quota_per_user,
  max_trials_per_month,
  is_program_active,
  leaderboard_period_title
)
SELECT 40, 50000, 2500, 25, 30, true, 'Top 5 Afiliator Bulan Ini'
WHERE NOT EXISTS (SELECT 1 FROM public.affiliate_settings);


-- 2. Table: affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  affiliate_code TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  commission_rate NUMERIC NOT NULL DEFAULT 40,
  max_trials_per_month INTEGER,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;

DROP POLICY IF EXISTS "Users can view their own affiliate profile" ON public.affiliates;
CREATE POLICY "Users can view their own affiliate profile" ON public.affiliates
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

DROP POLICY IF EXISTS "Eligible paid users can register as affiliate" ON public.affiliates;
CREATE POLICY "Eligible paid users can register as affiliate" ON public.affiliates
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.allowed_customers ac
        WHERE (ac.user_id = auth.uid() OR lower(ac.email) = lower(auth.jwt() ->> 'email'))
          AND ac.account_type IN ('annual', 'pro_annual', 'lifetime', 'regular', 'pro_lifetime')
          AND (ac.subscription_expires_at IS NULL OR ac.subscription_expires_at > now())
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
      )
      OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Affiliates can update their own profile" ON public.affiliates;
CREATE POLICY "Affiliates can update their own profile" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

DROP POLICY IF EXISTS "Admins can delete affiliates" ON public.affiliates;
CREATE POLICY "Admins can delete affiliates" ON public.affiliates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );


-- 3. Alter allowed_customers to track affiliate referral & custom trial quota
ALTER TABLE public.allowed_customers
  ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS trial_quota_limit INTEGER;

CREATE INDEX IF NOT EXISTS idx_allowed_customers_referred_by
  ON public.allowed_customers(referred_by_affiliate_id);

-- Affiliates can view and register trial leads (ONLY trial; ONLY Admin can upgrade to paid!)
DROP POLICY IF EXISTS "Affiliates can view their referred customers" ON public.allowed_customers;
CREATE POLICY "Affiliates can view their referred customers" ON public.allowed_customers
  FOR SELECT TO authenticated
  USING (
    referred_by_affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Affiliates can register trial leads" ON public.allowed_customers;
CREATE POLICY "Affiliates can register trial leads" ON public.allowed_customers
  FOR INSERT TO authenticated
  WITH CHECK (
    account_type = 'trial'
    AND subscription_expires_at IS NULL
    AND referred_by_affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE user_id = auth.uid() AND is_active = true
    )
  );


-- 4. Table: affiliate_payouts (Payout request & transfer history)
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  requested_amount NUMERIC NOT NULL CHECK (requested_amount > 0),
  admin_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL CHECK (net_amount >= 0),
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_holder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  admin_notes TEXT,
  transfer_reference TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate_id ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON public.affiliate_payouts(status);

ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;

DROP POLICY IF EXISTS "Affiliates can view own payouts" ON public.affiliate_payouts;
CREATE POLICY "Affiliates can view own payouts" ON public.affiliate_payouts
  FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

DROP POLICY IF EXISTS "Affiliates can request own payout" ON public.affiliate_payouts;
CREATE POLICY "Affiliates can request own payout" ON public.affiliate_payouts
  FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Admins can manage all payouts" ON public.affiliate_payouts;
CREATE POLICY "Admins can manage all payouts" ON public.affiliate_payouts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );


-- 5. Table: affiliate_commissions (Commission ledger per paid/renewed order)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  package_type TEXT NOT NULL,
  is_renewal BOOLEAN NOT NULL DEFAULT false,
  order_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 40,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payout_id UUID REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order_id ON public.affiliate_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_created_at ON public.affiliate_commissions(created_at DESC);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_commissions TO authenticated;
GRANT ALL ON public.affiliate_commissions TO service_role;

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

DROP POLICY IF EXISTS "Admins can manage all commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins can manage all commissions" ON public.affiliate_commissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );


-- 6. Table: affiliate_marketing_kits (CRUD by Admin, viewed by Affiliates)
CREATE TABLE IF NOT EXISTS public.affiliate_marketing_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'copywriting' CHECK (category IN ('copywriting', 'banner', 'video', 'presentasi', 'lainnya')),
  description TEXT,
  content_text TEXT,
  asset_url TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.affiliate_marketing_kits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_marketing_kits TO authenticated;
GRANT ALL ON public.affiliate_marketing_kits TO service_role;

DROP POLICY IF EXISTS "Authenticated can view active marketing kits" ON public.affiliate_marketing_kits;
CREATE POLICY "Authenticated can view active marketing kits" ON public.affiliate_marketing_kits
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

DROP POLICY IF EXISTS "Admins can manage marketing kits" ON public.affiliate_marketing_kits;
CREATE POLICY "Admins can manage marketing kits" ON public.affiliate_marketing_kits
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

-- Starter marketing kit items so affiliates immediately have ready-to-use promotional copy
INSERT INTO public.affiliate_marketing_kits (title, category, description, content_text, sort_order, is_active)
SELECT * FROM (VALUES
  (
    'Broadcast WhatsApp Grup Guru / KKG / MGMP',
    'copywriting',
    'Redaksi sopan dan informatif untuk dibagikan ke grup guru atau rekan sejawat.',
    E'Halo Bapak/Ibu Guru hebat! 👋✨\n\nLagi sibuk menyusun Modul Ajar, LKPD, Asesmen, atau Bank Soal Kurikulum Merdeka / KBC?\n\nSaya sendiri sudah pakai *ModulAjar.Online* — cukup masukkan mapel & materi, perangkat ajar lengkap langsung jadi dalam hitungan menit dan rapi diekspor ke Microsoft Word (.docx)! 📄✅\n\nKalau Bapak/Ibu mau lihat fitur lengkap atau coba dulu, bisa cek lewat tautan ini ya:\n👉 {LINK_AFILIASI}\n\nKalau mau coba *Akun Trial Gratis* dulu, boleh balas chat ini dan kirim alamat emailnya ya, nanti saya bantu aktifkan! 😊🙏\n\nSalam hangat,\n{NAMA_AFILIATOR}',
    1,
    true
  ),
  (
    'Caption Story WhatsApp / Instagram / Facebook',
    'copywriting',
    'Caption singkat yang cocok dipasangkan dengan screenshot hasil export Word Modul Ajar.',
    E'Dulu bikin 1 Modul Ajar + LKPD + Soal butuh berjam-jam sampai begadang 😅\nSekarang cukup 5 menit langsung jadi rapi format Word, lengkap sesuai Kurikulum Merdeka, Deep Learning & KBC Kemenag!\n\nRekan guru yang mau coba juga bisa cek langsung di sini 👇\n🔗 {LINK_AFILIASI}\n\nMau coba akun trial gratis dulu? DM atau chat saya ya! 🎓✨',
    2,
    true
  ),
  (
    'Skrip Follow Up Prospek Trial (Setelah Coba)',
    'copywriting',
    'Kirim ke rekan guru yang sudah Anda daftarkan akun trial untuk membantu closing.',
    E'Halo Bapak/Ibu, gimana pengalaman mencoba aplikasi *ModulAjar.Online* kemarin? Apakah sudah sempat mencoba fitur export ke Word-nya? 😊\n\nKalau dirasa sangat membantu meringankan administrasi mengajar, Bapak/Ibu bisa langsung upgrade ke Paket Standar (1 Tahun) atau Paket Pro lewat tautan ini agar aksesnya unlimited sepanjang tahun ajaran:\n👉 {LINK_AFILIASI}\n\nKalau ada kendala atau mau tanya-tanya dulu, langsung kabari saya ya! 🙏✨',
    3,
    true
  )
) AS v(title, category, description, content_text, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.affiliate_marketing_kits);


-- 7. Safe RPC Functions (SECURITY DEFINER)

-- 7a. Track affiliate landing page click (callable by anon/authenticated)
CREATE OR REPLACE FUNCTION public.track_affiliate_click(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN FALSE;
  END IF;

  UPDATE public.affiliates
  SET total_clicks = total_clicks + 1,
      updated_at = now()
  WHERE upper(affiliate_code) = upper(trim(p_code))
    AND is_active = true;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_affiliate_click(TEXT) TO anon, authenticated;

-- 7b. Public display info for referral code (no private fields exposed)
CREATE OR REPLACE FUNCTION public.get_affiliate_public_info(p_code TEXT)
RETURNS TABLE(id UUID, affiliate_code TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.affiliate_code, a.display_name
  FROM public.affiliates a
  WHERE upper(a.affiliate_code) = upper(trim(p_code))
    AND a.is_active = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_public_info(TEXT) TO anon, authenticated;

-- 7c. Global Leaderboard (Top N + optional period filter)
CREATE OR REPLACE FUNCTION public.get_affiliate_leaderboard(
  p_period TEXT DEFAULT 'month',
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  affiliate_id UUID,
  display_name TEXT,
  affiliate_code TEXT,
  total_conversions BIGINT,
  total_commission NUMERIC,
  rank_position BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_settings RECORD;
BEGIN
  SELECT leaderboard_start_date, leaderboard_end_date
  INTO v_settings
  FROM public.affiliate_settings
  LIMIT 1;

  IF p_period = 'week' THEN
    v_start := date_trunc('week', now());
    v_end := now() + interval '1 day';
  ELSIF p_period = 'month' THEN
    v_start := date_trunc('month', now());
    v_end := now() + interval '1 day';
  ELSIF p_period = 'contest' THEN
    v_start := COALESCE(p_start, v_settings.leaderboard_start_date, date_trunc('month', now()));
    v_end := COALESCE(p_end, v_settings.leaderboard_end_date, now() + interval '1 day');
  ELSE
    v_start := '2000-01-01'::timestamptz;
    v_end := now() + interval '1 day';
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT
      a.id AS aff_id,
      a.display_name AS dname,
      a.affiliate_code AS acode,
      COUNT(c.id) FILTER (
        WHERE c.status IN ('approved', 'paid')
          AND c.created_at >= v_start
          AND c.created_at <= v_end
      ) AS conv_count,
      COALESCE(SUM(c.commission_amount) FILTER (
        WHERE c.status IN ('approved', 'paid')
          AND c.created_at >= v_start
          AND c.created_at <= v_end
      ), 0) AS comm_sum
    FROM public.affiliates a
    LEFT JOIN public.affiliate_commissions c ON c.affiliate_id = a.id
    WHERE a.is_active = true
    GROUP BY a.id, a.display_name, a.affiliate_code
  )
  SELECT
    agg.aff_id,
    agg.dname,
    agg.acode,
    agg.conv_count,
    agg.comm_sum,
    ROW_NUMBER() OVER (ORDER BY agg.conv_count DESC, agg.comm_sum DESC, agg.dname ASC) AS rnk
  FROM agg
  ORDER BY rnk ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_leaderboard(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 7d. Trial usage counts for leads referred by the calling affiliate (or admin)
CREATE OR REPLACE FUNCTION public.get_affiliate_leads_usage(p_affiliate_id UUID)
RETURNS TABLE(customer_id UUID, generation_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_allowed BOOLEAN;
BEGIN
  SELECT (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = p_affiliate_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  ) INTO v_is_allowed;

  IF NOT v_is_allowed THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ac.id AS customer_id,
    COUNT(gl.id) AS generation_count
  FROM public.allowed_customers ac
  LEFT JOIN public.generation_logs gl
    ON gl.user_id = ac.user_id AND gl.content_type <> 'image'
  WHERE ac.referred_by_affiliate_id = p_affiliate_id
  GROUP BY ac.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_leads_usage(UUID) TO authenticated;
