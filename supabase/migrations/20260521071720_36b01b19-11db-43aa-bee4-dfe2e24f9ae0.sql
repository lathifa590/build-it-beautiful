
-- ============================================================
-- FASE 1: AGENCY / RESELLER FOUNDATION
-- ============================================================

-- Add new role values for future use (cannot be used in same transaction
-- as policies in Postgres, so policies below use table-based checks)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency_member';

-- ============================================================
-- 1. AGENCY PACKAGES (managed by super admin)
-- ============================================================
CREATE TABLE public.agency_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('mini','lite','pro','max')),
  quota integer NOT NULL CHECK (quota > 0),
  price_idr integer NOT NULL CHECK (price_idr >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage agency packages"
  ON public.agency_packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active packages"
  ON public.agency_packages FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TRIGGER trg_agency_packages_updated
  BEFORE UPDATE ON public.agency_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. AGENCY OWNERS (resellers)
-- ============================================================
CREATE TABLE public.agency_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  company_name text NOT NULL,
  whatsapp_number text,
  mini_quota integer NOT NULL DEFAULT 0,
  mini_used integer NOT NULL DEFAULT 0,
  lite_quota integer NOT NULL DEFAULT 0,
  lite_used integer NOT NULL DEFAULT 0,
  pro_quota integer NOT NULL DEFAULT 0,
  pro_used integer NOT NULL DEFAULT 0,
  max_quota integer NOT NULL DEFAULT 0,
  max_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_owners_user_id ON public.agency_owners(user_id);
CREATE INDEX idx_agency_owners_email ON public.agency_owners(lower(email));

ALTER TABLE public.agency_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all agency owners"
  ON public.agency_owners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency owner views own record"
  ON public.agency_owners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Agency owner updates own profile fields"
  ON public.agency_owners FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_agency_owners_updated
  BEFORE UPDATE ON public.agency_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. AGENCY INVITES
-- ============================================================
CREATE TABLE public.agency_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_owner_id uuid NOT NULL REFERENCES public.agency_owners(id) ON DELETE CASCADE,
  email text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('mini','lite','pro','max')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  custom_message text,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_user_id uuid,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agency_invites_owner ON public.agency_invites(agency_owner_id);
CREATE INDEX idx_agency_invites_email_status ON public.agency_invites(lower(email), status);
CREATE INDEX idx_agency_invites_token ON public.agency_invites(token);

ALTER TABLE public.agency_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all invites"
  ON public.agency_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency owner manages own invites"
  ON public.agency_invites FOR ALL TO authenticated
  USING (agency_owner_id IN (SELECT id FROM public.agency_owners WHERE user_id = auth.uid()))
  WITH CHECK (agency_owner_id IN (SELECT id FROM public.agency_owners WHERE user_id = auth.uid()));

CREATE POLICY "Invited user views own invite"
  ON public.agency_invites FOR SELECT TO authenticated
  USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE TRIGGER trg_agency_invites_updated
  BEFORE UPDATE ON public.agency_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. AGENCY MEMBERS
-- ============================================================
CREATE TABLE public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_owner_id uuid NOT NULL REFERENCES public.agency_owners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('mini','lite','pro','max')),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_owner_id, user_id)
);

CREATE INDEX idx_agency_members_owner ON public.agency_members(agency_owner_id);
CREATE INDEX idx_agency_members_user ON public.agency_members(user_id);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all members"
  ON public.agency_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency owner views own members"
  ON public.agency_members FOR SELECT TO authenticated
  USING (agency_owner_id IN (SELECT id FROM public.agency_owners WHERE user_id = auth.uid()));

CREATE POLICY "Member views own record"
  ON public.agency_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_agency_members_updated
  BEFORE UPDATE ON public.agency_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. SEED 6 DEFAULT PACKAGES (admin can edit later)
-- ============================================================
INSERT INTO public.agency_packages (code, name, tier, quota, price_idr, sort_order) VALUES
  ('agency_mini_starter', 'Agency Mini Starter', 'mini', 5,   500000,  10),
  ('agency_lite_starter', 'Agency Lite Starter', 'lite', 10,  900000,  20),
  ('agency_pro_starter',  'Agency Pro Starter',  'pro',  25, 2000000,  30),
  ('agency_pro_plus',     'Agency Pro Plus',     'pro',  50, 3800000,  40),
  ('agency_max_starter',  'Agency Max Starter',  'max',  75, 5500000,  50),
  ('agency_max_plus',     'Agency Max Plus',     'max', 100, 7000000,  60);

-- ============================================================
-- 6. RPC: create_agency_invite (atomic quota decrement)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_agency_invite(
  _email text,
  _tier text,
  _custom_message text DEFAULT NULL
)
RETURNS public.agency_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner public.agency_owners%ROWTYPE;
  v_invite public.agency_invites%ROWTYPE;
  v_quota int;
  v_used int;
BEGIN
  IF _tier NOT IN ('mini','lite','pro','max') THEN
    RAISE EXCEPTION 'Tier tidak valid';
  END IF;

  SELECT * INTO v_owner FROM public.agency_owners
    WHERE user_id = auth.uid() AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bukan agency owner aktif';
  END IF;

  -- Check quota for the tier
  EXECUTE format('SELECT ($1).%I, ($1).%I', _tier || '_quota', _tier || '_used')
    INTO v_quota, v_used USING v_owner;

  IF (v_quota - v_used) < 1 THEN
    RAISE EXCEPTION 'Kuota % tidak mencukupi (sisa %)', _tier, (v_quota - v_used);
  END IF;

  -- Duplicate check: same email already active member of this owner, or pending invite
  IF EXISTS (
    SELECT 1 FROM public.agency_invites
    WHERE agency_owner_id = v_owner.id
      AND lower(email) = lower(_email)
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Sudah ada invite pending untuk email ini';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_owner_id = v_owner.id
      AND lower(email) = lower(_email)
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Email ini sudah jadi member aktif Anda';
  END IF;

  INSERT INTO public.agency_invites (agency_owner_id, email, tier, custom_message)
  VALUES (v_owner.id, lower(_email), _tier, _custom_message)
  RETURNING * INTO v_invite;

  -- Increment used counter
  EXECUTE format('UPDATE public.agency_owners SET %I = %I + 1 WHERE id = $1',
                 _tier || '_used', _tier || '_used')
    USING v_owner.id;

  RETURN v_invite;
END;
$$;

-- ============================================================
-- 7. Update handle_new_user to auto-accept agency invites
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
  v_invite public.agency_invites%ROWTYPE;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;

  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);

  -- First user = admin, rest = user
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  -- Auto-accept oldest pending agency invite for this email
  SELECT * INTO v_invite
  FROM public.agency_invites
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending'
  ORDER BY invited_at ASC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.agency_invites
       SET status = 'accepted',
           accepted_user_id = NEW.id,
           accepted_at = now()
     WHERE id = v_invite.id;

    INSERT INTO public.agency_members (agency_owner_id, user_id, email, tier, expires_at)
    VALUES (v_invite.agency_owner_id, NEW.id, NEW.email, v_invite.tier, now() + interval '365 days')
    ON CONFLICT (agency_owner_id, user_id) DO UPDATE
      SET expires_at = EXCLUDED.expires_at, is_active = true, tier = EXCLUDED.tier;

    -- Sync to allowed_customers as annual subscription
    INSERT INTO public.allowed_customers (email, name, account_type, subscription_expires_at, user_id, is_claimed, claimed_at)
    VALUES (NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
            'annual',
            now() + interval '365 days',
            NEW.id,
            true,
            now())
    ON CONFLICT (email) DO UPDATE
      SET account_type = 'annual',
          subscription_expires_at = now() + interval '365 days',
          user_id = NEW.id,
          is_claimed = true,
          claimed_at = COALESCE(public.allowed_customers.claimed_at, now()),
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;
