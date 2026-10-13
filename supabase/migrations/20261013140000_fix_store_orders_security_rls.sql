-- ==============================================================
-- Migrasi: Pengamanan Row Level Security (RLS) modul_store_orders
-- OWASP A01: Broken Access Control & A04: Data Privacy
-- ==============================================================

-- 1. Hapus kebijakan over-permissive yang memungkinkan dump seluruh order & manipulasi status
DROP POLICY IF EXISTS "Public can view own order" ON public.modul_store_orders;
DROP POLICY IF EXISTS "Public can update own order" ON public.modul_store_orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.modul_store_orders;

-- 2. Kebijakan INSERT: Publik anonim hanya boleh membuat order berstatus PENDING_PAYMENT
CREATE POLICY "Public can create orders with initial status" ON public.modul_store_orders
  FOR INSERT WITH CHECK (
    status = 'PENDING_PAYMENT'
  );

-- 3. Kebijakan UPDATE: Pembeli hanya diizinkan mengubah status dari PENDING_PAYMENT ke PENDING_REVIEW
-- Mencegah pembeli mengubah sendiri status pesanan menjadi PAID atau COMPLETED
CREATE POLICY "Buyers can only transition to review" ON public.modul_store_orders
  FOR UPDATE USING (
    status = 'PENDING_PAYMENT'
  ) WITH CHECK (
    status = 'PENDING_REVIEW'
  );

-- 4. Kebijakan SELECT: Penjual bisa melihat seluruh order tokonya;
-- Pengguna terotentikasi bisa melihat order miliknya
CREATE POLICY "Sellers and logged in buyers can view orders" ON public.modul_store_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.modul_store_profiles p
      WHERE p.store_id = modul_store_orders.store_id AND p.owner_user_id = auth.uid()
    )
    OR
    (auth.uid() IS NOT NULL AND lower(buyer_email) = lower(auth.jwt()->>'email'))
  );

-- 5. RPC Aman untuk Pelacakan Pesanan Anonim (Mencegah Table Scanning)
CREATE OR REPLACE FUNCTION public.track_store_order(p_email text, p_invoice_number text)
RETURNS TABLE (
  order_id uuid,
  invoice_number text,
  status text,
  total_amount numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR p_invoice_number IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT o.order_id, o.invoice_number, o.status, o.total_amount, o.created_at
  FROM public.modul_store_orders o
  WHERE lower(o.buyer_email) = lower(trim(p_email))
    AND o.invoice_number ILIKE ('%' || trim(p_invoice_number) || '%')
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_store_order(text, text) TO anon, authenticated;

-- 6. RPC Aman untuk Mengambil Rincian Pesanan Anonim Berdasarkan Order ID UUID
CREATE OR REPLACE FUNCTION public.get_store_order_by_id(p_order_id uuid)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res JSONB;
BEGIN
  SELECT jsonb_build_object(
    'order_id', o.order_id,
    'invoice_number', o.invoice_number,
    'store_id', o.store_id,
    'listing_id', o.listing_id,
    'buyer_name', o.buyer_name,
    'buyer_email', o.buyer_email,
    'buyer_whatsapp', o.buyer_whatsapp,
    'original_amount', o.original_amount,
    'discount_amount', o.discount_amount,
    'total_amount', o.total_amount,
    'status', o.status,
    'payment_method', o.payment_method,
    'payment_proof_url', o.payment_proof_url,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'listing', (
      SELECT jsonb_build_object(
        'listing_id', l.listing_id,
        'title', l.title,
        'price', l.price,
        'category', l.category,
        'file_path', CASE WHEN o.status = 'COMPLETED' THEN l.file_path ELSE NULL END,
        'store_profile', (
          SELECT jsonb_build_object(
            'store_name', sp.store_name,
            'bank_name', sp.bank_name,
            'bank_account_number', sp.bank_account_number,
            'bank_account_name', sp.bank_account_name,
            'whatsapp_number', sp.whatsapp_number
          )
          FROM public.modul_store_profiles sp
          WHERE sp.store_id = l.store_id
        )
      )
      FROM public.modul_store_listings l
      WHERE l.listing_id = o.listing_id
    )
  ) INTO v_res
  FROM public.modul_store_orders o
  WHERE o.order_id = p_order_id;

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_order_by_id(uuid) TO anon, authenticated;
