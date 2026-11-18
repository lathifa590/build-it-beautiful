-- ============================================================================
-- HOTFIX: Break RLS infinite recursion between affiliates <-> allowed_customers
--         using SECURITY DEFINER helper functions
-- ============================================================================

-- Helper 1: Check whether a user is eligible to register as an affiliate (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_eligible_for_affiliate(p_user_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF lower(COALESCE(p_email, '')) = 'jagofeed@gmail.com' THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.allowed_customers ac
    WHERE (ac.user_id = p_user_id OR (p_email IS NOT NULL AND lower(ac.email) = lower(p_email)))
      AND ac.account_type IN ('annual', 'pro_annual', 'lifetime', 'regular', 'pro_lifetime')
      AND (ac.subscription_expires_at IS NULL OR ac.subscription_expires_at > now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_eligible_for_affiliate(UUID, TEXT) TO authenticated;

-- Helper 2: Get active affiliate_id for a user_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_affiliate_id(p_user_id UUID, p_require_active BOOLEAN DEFAULT FALSE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_id
  FROM public.affiliates
  WHERE user_id = p_user_id
    AND (NOT p_require_active OR is_active = true)
  LIMIT 1;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_affiliate_id(UUID, BOOLEAN) TO authenticated;

-- Replace recursive INSERT policy on affiliates
DROP POLICY IF EXISTS "Eligible paid users can register as affiliate" ON public.affiliates;
CREATE POLICY "Eligible paid users can register as affiliate" ON public.affiliates
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_eligible_for_affiliate(auth.uid(), auth.jwt() ->> 'email')
  );

-- Replace recursive SELECT & INSERT policies on allowed_customers
DROP POLICY IF EXISTS "Affiliates can view their referred customers" ON public.allowed_customers;
CREATE POLICY "Affiliates can view their referred customers" ON public.allowed_customers
  FOR SELECT TO authenticated
  USING (
    referred_by_affiliate_id IS NOT NULL
    AND referred_by_affiliate_id = public.get_my_affiliate_id(auth.uid(), false)
  );

DROP POLICY IF EXISTS "Affiliates can register trial leads" ON public.allowed_customers;
CREATE POLICY "Affiliates can register trial leads" ON public.allowed_customers
  FOR INSERT TO authenticated
  WITH CHECK (
    account_type = 'trial'
    AND subscription_expires_at IS NULL
    AND referred_by_affiliate_id IS NOT NULL
    AND referred_by_affiliate_id = public.get_my_affiliate_id(auth.uid(), true)
  );

-- Also optimize affiliate_payouts & affiliate_commissions policies with helper
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON public.affiliate_payouts;
CREATE POLICY "Affiliates can view own payouts" ON public.affiliate_payouts
  FOR SELECT TO authenticated
  USING (
    affiliate_id = public.get_my_affiliate_id(auth.uid(), false)
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
    AND affiliate_id = public.get_my_affiliate_id(auth.uid(), true)
  );

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated
  USING (
    affiliate_id = public.get_my_affiliate_id(auth.uid(), false)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );
