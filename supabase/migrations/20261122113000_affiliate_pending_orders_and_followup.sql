-- ==============================================================
-- MIGRATION: Affiliate Referral Orders & Follow Up Tracking
-- 1. Tambah kolom pelacakan follow-up pada orders
-- 2. Kebijakan RLS agar Afiliator dapat membaca referral orders miliknya
-- 3. RPC get_affiliate_referral_orders & mark_order_followed_up
-- ==============================================================

-- 1. Tambah kolom pelacakan follow-up
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_followed_up_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_followed_up_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_followed_up_note TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_affiliate_code ON public.orders(affiliate_code);

-- 2. Policy RLS: Afiliator yang login bisa membaca pesanan yang menggunakan kode afiliasinya
DROP POLICY IF EXISTS "Affiliates can view their referral orders" ON public.orders;
CREATE POLICY "Affiliates can view their referral orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.user_id = auth.uid()
        AND UPPER(affiliates.affiliate_code) = UPPER(orders.affiliate_code)
    )
  );

-- 3. Function RPC: get_affiliate_referral_orders
CREATE OR REPLACE FUNCTION public.get_affiliate_referral_orders(p_affiliate_id UUID)
RETURNS TABLE(
  order_id UUID,
  invoice TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_whatsapp TEXT,
  package_type TEXT,
  item_title TEXT,
  price NUMERIC,
  discount_amount NUMERIC,
  total_amount NUMERIC,
  unique_code INTEGER,
  status TEXT,
  affiliate_code TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  last_followed_up_at TIMESTAMPTZ,
  last_followed_up_by TEXT,
  last_followed_up_note TEXT,
  estimated_commission NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_allowed BOOLEAN;
  v_code TEXT;
  v_rate NUMERIC;
BEGIN
  SELECT
    (
      EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = p_affiliate_id AND a.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
    ),
    aff.affiliate_code,
    COALESCE(aff.commission_rate, 40)
  INTO v_is_allowed, v_code, v_rate
  FROM public.affiliates aff
  WHERE aff.id = p_affiliate_id;

  IF NOT v_is_allowed OR v_code IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.invoice,
    o.buyer_name,
    o.buyer_email,
    o.buyer_whatsapp,
    o.package_type,
    o.item_title,
    o.price,
    o.discount_amount,
    o.total_amount,
    o.unique_code,
    o.status,
    o.affiliate_code,
    o.created_at,
    o.paid_at,
    o.last_followed_up_at,
    o.last_followed_up_by,
    o.last_followed_up_note,
    ROUND((GREATEST(0, o.price - o.discount_amount) * v_rate) / 100) AS estimated_commission
  FROM public.orders o
  WHERE UPPER(o.affiliate_code) = UPPER(v_code)
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_referral_orders(UUID) TO authenticated;

-- 4. Function RPC: mark_order_followed_up
CREATE OR REPLACE FUNCTION public.mark_order_followed_up(
  p_order_id UUID,
  p_by TEXT DEFAULT 'affiliate',
  p_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_is_allowed BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_order FROM public.orders ord WHERE ord.id = p_order_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Cek apakah admin
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
     OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com' THEN
    v_is_allowed := TRUE;
  -- Cek apakah afiliator pemilik kode pesanan ini
  ELSIF v_order.affiliate_code IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.affiliates aff
    WHERE aff.user_id = auth.uid()
      AND UPPER(aff.affiliate_code) = UPPER(v_order.affiliate_code)
  ) THEN
    v_is_allowed := TRUE;
  END IF;

  IF NOT v_is_allowed THEN
    RETURN FALSE;
  END IF;

  UPDATE public.orders
  SET
    last_followed_up_at = now(),
    last_followed_up_by = p_by,
    last_followed_up_note = COALESCE(p_note, public.orders.last_followed_up_note),
    updated_at = now()
  WHERE public.orders.id = p_order_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_order_followed_up(UUID, TEXT, TEXT) TO authenticated;
