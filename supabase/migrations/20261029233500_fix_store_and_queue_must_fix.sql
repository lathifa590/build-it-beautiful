-- ==============================================================
-- Migrasi: Perbaikan Must-Fix Audit (Store Checkout, Download, Kupon, & Queue Lock)
-- ==============================================================

-- 1. Atomic queue job claim supporting optional workspace_id (#6)
CREATE OR REPLACE FUNCTION public.claim_generation_jobs(
  p_limit INT DEFAULT 3,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS SETOF public.generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT id FROM public.generation_queue
    WHERE status = 'pending'
      AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.generation_queue g
    SET status = 'processing', updated_at = now()
    FROM claimed c
    WHERE g.id = c.id
    RETURNING g.*
  )
  SELECT * FROM updated ORDER BY created_at ASC;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.claim_generation_jobs(INT, UUID) TO service_role, authenticated;

-- 2. Allow free orders (status = 'SELESAI' when total_amount = 0) and anonymous order creation + atomic coupon usage (#4, #8)
DROP POLICY IF EXISTS "Public can create orders with initial status" ON public.modul_store_orders;
CREATE POLICY "Public can create orders with initial status" ON public.modul_store_orders
  FOR INSERT WITH CHECK (
    status = 'PENDING_PAYMENT' OR (status = 'SELESAI' AND total_amount = 0)
  );

CREATE OR REPLACE FUNCTION public.create_store_order(
  p_invoice_number text,
  p_store_id uuid,
  p_listing_id uuid,
  p_buyer_email text,
  p_buyer_name text,
  p_buyer_whatsapp text DEFAULT NULL,
  p_total_amount integer DEFAULT 0,
  p_coupon_code_used text DEFAULT NULL,
  p_status text DEFAULT 'PENDING_PAYMENT'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.modul_store_orders;
  v_safe_status text;
BEGIN
  v_safe_status := CASE WHEN p_total_amount <= 0 AND p_status = 'SELESAI' THEN 'SELESAI' ELSE 'PENDING_PAYMENT' END;

  INSERT INTO public.modul_store_orders (
    invoice_number, store_id, listing_id, buyer_email, buyer_name,
    buyer_whatsapp, total_amount, coupon_code_used, status
  ) VALUES (
    p_invoice_number, p_store_id, p_listing_id, trim(p_buyer_email), trim(p_buyer_name),
    p_buyer_whatsapp, GREATEST(0, COALESCE(p_total_amount, 0)), p_coupon_code_used, v_safe_status
  )
  RETURNING * INTO v_order;

  IF p_coupon_code_used IS NOT NULL AND length(trim(p_coupon_code_used)) > 0 THEN
    UPDATE public.modul_store_coupons
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE store_id = p_store_id
      AND upper(code) = upper(trim(p_coupon_code_used))
      AND status = 'ACTIVE';
  END IF;

  RETURN to_jsonb(v_order);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_store_order(text, uuid, uuid, text, text, text, integer, text, text) TO anon, authenticated;

-- 3. Fix get_store_order_by_id to use real columns and return url_modul_ajar when status = 'SELESAI' (#4)
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
    'total_amount', o.total_amount,
    'coupon_code_used', o.coupon_code_used,
    'status', o.status,
    'payment_proof_url', o.payment_proof_url,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'listing', (
      SELECT jsonb_build_object(
        'listing_id', l.listing_id,
        'title', l.title,
        'price_amount', l.price_amount,
        'category', l.category,
        'preview_image_url', l.preview_image_url,
        'url_modul_ajar', CASE WHEN o.status = 'SELESAI' THEN l.url_modul_ajar ELSE NULL END,
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

-- 4. Fix buyer download policy on storage.objects for modul_store_files (#3)
DROP POLICY IF EXISTS "Buyers can download files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can download purchased files" ON storage.objects;

CREATE POLICY "Buyers can download completed order files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'modul_store_files'
  AND EXISTS (
    SELECT 1
    FROM public.modul_store_orders o
    JOIN public.modul_store_listings l ON l.listing_id = o.listing_id
    WHERE o.status = 'SELESAI'
      AND l.url_modul_ajar = storage.objects.name
  )
);

-- 5. Atomic store metric increment to prevent race-condition duplicate rows (#10)
CREATE UNIQUE INDEX IF NOT EXISTS idx_modul_store_metrics_store_day
  ON public.modul_store_metrics (store_id, date)
  WHERE listing_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_modul_store_metrics_listing_day
  ON public.modul_store_metrics (store_id, date, listing_id)
  WHERE listing_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.increment_store_metric(
  p_store_id uuid,
  p_listing_id uuid DEFAULT NULL,
  p_type text DEFAULT 'store_view',
  p_date date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_type IN ('store_view', 'views', 'product_view', 'clicks') THEN
    INSERT INTO public.modul_store_metrics (store_id, date, listing_id, store_views, product_views)
    VALUES (p_store_id, p_date, NULL, 1, 0)
    ON CONFLICT (store_id, date) WHERE listing_id IS NULL
    DO UPDATE SET store_views = COALESCE(public.modul_store_metrics.store_views, 0) + 1;
  END IF;

  IF p_type IN ('product_view', 'clicks') AND p_listing_id IS NOT NULL THEN
    INSERT INTO public.modul_store_metrics (store_id, date, listing_id, store_views, product_views)
    VALUES (p_store_id, p_date, p_listing_id, 0, 1)
    ON CONFLICT (store_id, date, listing_id) WHERE listing_id IS NOT NULL
    DO UPDATE SET product_views = COALESCE(public.modul_store_metrics.product_views, 0) + 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_store_metric(uuid, uuid, text, date) TO anon, authenticated, service_role;
