-- Skema Tabel untuk ModulAjar Store (Marketplace Publik)

-- 1. Profil Toko (Store Profiles)
CREATE TABLE IF NOT EXISTS public.modul_store_profiles (
  store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  category TEXT,
  avatar_url TEXT,
  banner_desktop_url TEXT,
  banner_mobile_url TEXT,
  primary_color TEXT DEFAULT '#4F46E5',
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, BANNED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_user_id)
);

-- 2. Karya/Listing (Store Listings)
CREATE TABLE IF NOT EXISTS public.modul_store_listings (
  listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.modul_store_profiles(store_id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  history_id UUID REFERENCES public.content_history(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_amount INTEGER DEFAULT 0,
  normal_price_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, TAKEDOWN
  preview_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 3. Pesanan Manual & Invoice (Store Orders)
CREATE TABLE IF NOT EXISTS public.modul_store_orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  store_id UUID NOT NULL REFERENCES public.modul_store_profiles(store_id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.modul_store_listings(listing_id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_whatsapp TEXT,
  total_amount INTEGER NOT NULL,
  coupon_code_used TEXT,
  status TEXT DEFAULT 'PENDING_PAYMENT', -- PENDING_PAYMENT, PENDING_REVIEW, SELESAI, BATAL
  payment_proof_url TEXT,
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Kupon Diskon (Store Coupons)
CREATE TABLE IF NOT EXISTS public.modul_store_coupons (
  coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.modul_store_profiles(store_id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL, -- PERCENTAGE, NOMINAL
  discount_value INTEGER NOT NULL,
  min_purchase INTEGER DEFAULT 0,
  max_discount INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, code)
);

-- 5. Metrik Toko Harian (Store Metrics)
CREATE TABLE IF NOT EXISTS public.modul_store_metrics (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  store_id UUID NOT NULL REFERENCES public.modul_store_profiles(store_id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.modul_store_listings(listing_id) ON DELETE CASCADE,
  store_views INTEGER DEFAULT 0,
  product_views INTEGER DEFAULT 0,
  checkout_started INTEGER DEFAULT 0,
  orders_completed INTEGER DEFAULT 0,
  revenue_amount INTEGER DEFAULT 0,
  UNIQUE(date, store_id, listing_id)
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE public.modul_store_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modul_store_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modul_store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modul_store_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modul_store_metrics ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
-- Publik bisa baca profil yang ACTIVE
CREATE POLICY "Public can view active profiles" ON public.modul_store_profiles
  FOR SELECT USING (status = 'ACTIVE');

-- Owner bisa insert, update, dan select profilnya sendiri (meski tidak active)
CREATE POLICY "Users can manage their own profile" ON public.modul_store_profiles
  FOR ALL USING (auth.uid() = owner_user_id);

-- 2. Listings
-- Publik bisa baca listing yang PUBLISHED dari toko yang ACTIVE
CREATE POLICY "Public can view published listings" ON public.modul_store_listings
  FOR SELECT USING (
    status = 'PUBLISHED' 
    AND EXISTS (
      SELECT 1 FROM public.modul_store_profiles p 
      WHERE p.store_id = modul_store_listings.store_id AND p.status = 'ACTIVE'
    )
  );

-- Owner bisa manage listing di tokonya sendiri
CREATE POLICY "Users can manage their own listings" ON public.modul_store_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.modul_store_profiles p
      WHERE p.store_id = modul_store_listings.store_id AND p.owner_user_id = auth.uid()
    )
  );

-- 3. Orders
-- Owner bisa baca dan update order masuk ke tokonya
CREATE POLICY "Sellers can manage orders for their store" ON public.modul_store_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.modul_store_profiles p
      WHERE p.store_id = modul_store_orders.store_id AND p.owner_user_id = auth.uid()
    )
  );

-- Publik anonim bisa INSERT order baru saat checkout
CREATE POLICY "Public can create orders" ON public.modul_store_orders
  FOR INSERT WITH CHECK (true);

-- Publik anonim bisa UPDATE order mereka (upload bukti bayar) jika tau ID-nya 
CREATE POLICY "Public can update own order" ON public.modul_store_orders
  FOR UPDATE USING (true);

-- Publik anonim bisa SELECT order mereka (cek status)
CREATE POLICY "Public can view own order" ON public.modul_store_orders
  FOR SELECT USING (true);


-- 4. Coupons
-- Owner bisa manage kupon di tokonya sendiri
CREATE POLICY "Sellers can manage their own coupons" ON public.modul_store_coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.modul_store_profiles p
      WHERE p.store_id = modul_store_coupons.store_id AND p.owner_user_id = auth.uid()
    )
  );

-- Publik bisa baca kupon untuk divalidasi saat checkout (hanya yang ACTIVE)
CREATE POLICY "Public can view active coupons" ON public.modul_store_coupons
  FOR SELECT USING (status = 'ACTIVE');

-- 5. Metrics
-- Owner bisa manage metrik tokonya sendiri
CREATE POLICY "Sellers can view their own metrics" ON public.modul_store_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.modul_store_profiles p
      WHERE p.store_id = modul_store_metrics.store_id AND p.owner_user_id = auth.uid()
    )
  );

-- Publik bisa menambah metrik (misal view product increment via function) - biasanya via Postgres Function
-- Sementara diizinkan INSERT/UPDATE anon untuk view tracker
CREATE POLICY "Public can insert metrics" ON public.modul_store_metrics
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update metrics" ON public.modul_store_metrics
  FOR UPDATE USING (true);
