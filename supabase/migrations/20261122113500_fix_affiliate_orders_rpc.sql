-- Drop and recreate RPC get_affiliate_referral_orders
DROP FUNCTION IF EXISTS public.get_affiliate_referral_orders(UUID);

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
