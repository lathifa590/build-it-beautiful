-- ============================================================================
-- MIGRATION: Create Orders, Coupons, and Payment Settings for Direct Sales
-- ============================================================================

-- 1. Table: Orders (Transaksi Pembelian Paket Modul Ajar & Produk Digital)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_whatsapp TEXT NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('lite', 'annual', 'pro_annual', 'standar', 'pro', 'bundle', 'product', 'subscription')),
  item_title TEXT NOT NULL,
  original_price NUMERIC DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  unique_code INTEGER DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'manual_transfer',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  affiliate_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_invoice ON public.orders(invoice);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- Policies on orders
DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Anyone can create order" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (
    auth.uid() = user_id 
    OR (auth.jwt() ->> 'email') = buyer_email
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" ON public.orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );


-- 2. Table: Coupons (Kupon & Voucher Diskon)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
  max_discount_amount NUMERIC,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  applicable_to TEXT NOT NULL DEFAULT 'all' CHECK (applicable_to IN ('all', 'lite', 'annual', 'pro_annual', 'subscription')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

-- Sample starter coupons
INSERT INTO public.coupons (code, name, discount_type, discount_value, min_purchase_amount, is_active)
VALUES 
  ('HEMAT20', 'Diskon Spesial 20%', 'percentage', 20, 0, true),
  ('GURUBARU', 'Potongan Rp 25.000', 'fixed', 25000, 90000, true)
ON CONFLICT (code) DO NOTHING;


-- 3. Table: Payment Settings (Rekening Bank Admin & Pengaturan Pembayaran)
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL DEFAULT 'BCA',
  bank_account_number TEXT NOT NULL DEFAULT '1234567890',
  bank_account_holder TEXT NOT NULL DEFAULT 'Admin ModulAjar',
  qris_image_url TEXT,
  whatsapp_number TEXT NOT NULL DEFAULT '6288228511309',
  instructions TEXT DEFAULT 'Silakan transfer sesuai nominal total tagihan (termasuk 3 digit kode unik) agar verifikasi dan aktivasi otomatis berjalan cepat.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT ALL ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

DROP POLICY IF EXISTS "Anyone can read payment settings" ON public.payment_settings;
CREATE POLICY "Anyone can read payment settings" ON public.payment_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage payment settings" ON public.payment_settings;
CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
    OR (auth.jwt() ->> 'email') = 'jagofeed@gmail.com'
  );

-- Seed default payment settings
INSERT INTO public.payment_settings (
  bank_name,
  bank_account_number,
  bank_account_holder,
  whatsapp_number,
  instructions
)
SELECT 
  'BCA',
  '1234567890',
  'Admin ModulAjar',
  '6288228511309',
  'Silakan transfer sesuai nominal total tagihan (termasuk 3 digit kode unik) agar verifikasi pembayaran berjalan cepat.'
WHERE NOT EXISTS (SELECT 1 FROM public.payment_settings);
