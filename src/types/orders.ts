export type PackageType = 'lite' | 'annual' | 'pro_annual' | 'standar' | 'pro' | 'bundle' | 'product' | 'subscription';
export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'manual_transfer' | 'qris';
export type DiscountType = 'percentage' | 'fixed';
export type CouponApplicableTo = 'all' | 'lite' | 'annual' | 'pro_annual' | 'subscription';

export interface PackageDetail {
  id: PackageType;
  slug: string;
  name: string;
  label: string;
  price: number;
  originalPrice: number;
  periodText: string;
  durationMonths: number;
  accountType: 'lite' | 'annual' | 'pro_annual';
  badge?: string;
  description: string;
  features: string[];
}

export const PACKAGES_CONFIG: Record<string, PackageDetail> = {
  lite: {
    id: 'lite',
    slug: 'lite',
    name: 'Paket Lite',
    label: 'Lite (6 Bulan)',
    price: 99000,
    originalPrice: 149000,
    periodText: '6 bulan',
    durationMonths: 6,
    accountType: 'lite',
    badge: 'Hemat',
    description: 'Cocok bagi yang mau coba-coba dulu & butuh modul ajar instan',
    features: [
      'Akses 6 Bulan Penuh',
      'Mode Cepat (Modul Instan AI)',
      'Modul Multi-Pertemuan',
      'Kurikulum Merdeka & KBC Kemenag',
      'Export Word (.docx) & PDF',
      'Update Fitur Reguler',
    ],
  },
  standar: {
    id: 'standar',
    slug: 'standar',
    name: 'Paket Standar',
    label: 'Standar (1 Tahun)',
    price: 149000,
    originalPrice: 199000,
    periodText: '1 tahun',
    durationMonths: 12,
    accountType: 'annual',
    badge: 'Populer',
    description: 'Cocok untuk kebutuhan mengajar sepanjang tahun ajaran',
    features: [
      'Akses 1 Tahun Penuh',
      'Mode Cepat (Modul Instan AI)',
      'Modul Multi-Pertemuan',
      'Kurikulum Merdeka & KBC Kemenag',
      'Generator KKTP & Asesmen Lengkap',
      'Export Word (.docx) & PDF',
      'Update Fitur Reguler',
    ],
  },
  annual: {
    id: 'annual',
    slug: 'annual',
    name: 'Paket Standar',
    label: 'Standar (1 Tahun)',
    price: 149000,
    originalPrice: 199000,
    periodText: '1 tahun',
    durationMonths: 12,
    accountType: 'annual',
    badge: 'Populer',
    description: 'Cocok untuk kebutuhan mengajar sepanjang tahun ajaran',
    features: [
      'Akses 1 Tahun Penuh',
      'Mode Cepat (Modul Instan AI)',
      'Modul Multi-Pertemuan',
      'Kurikulum Merdeka & KBC Kemenag',
      'Generator KKTP & Asesmen Lengkap',
      'Export Word (.docx) & PDF',
      'Update Fitur Reguler',
    ],
  },
  pro: {
    id: 'pro',
    slug: 'pro',
    name: 'Paket Pro',
    label: 'Pro (1 Tahun)',
    price: 197000,
    originalPrice: 299000,
    periodText: '1 tahun',
    durationMonths: 12,
    accountType: 'pro_annual',
    badge: 'Rekomendasi Utama',
    description: 'Untuk manajemen jangka panjang, toko digital & workspace lengkap',
    features: [
      'Semua fitur Paket Standar',
      'Akses Penuh Mode Workspace',
      'Toko Digital (Jual Modul Ajar Sendiri)',
      'Blog SEO & Personal Branding',
      'Tracking Progress Prosem & JP',
      'Penyimpanan Dokumen Reusable',
      'Dukungan Prioritas WhatsApp',
    ],
  },
  pro_annual: {
    id: 'pro_annual',
    slug: 'pro_annual',
    name: 'Paket Pro',
    label: 'Pro (1 Tahun)',
    price: 197000,
    originalPrice: 299000,
    periodText: '1 tahun',
    durationMonths: 12,
    accountType: 'pro_annual',
    badge: 'Rekomendasi Utama',
    description: 'Untuk manajemen jangka panjang, toko digital & workspace lengkap',
    features: [
      'Semua fitur Paket Standar',
      'Akses Penuh Mode Workspace',
      'Toko Digital (Jual Modul Ajar Sendiri)',
      'Blog SEO & Personal Branding',
      'Tracking Progress Prosem & JP',
      'Penyimpanan Dokumen Reusable',
      'Dukungan Prioritas WhatsApp',
    ],
  },
};

export interface Order {
  id: string;
  invoice: string;
  user_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_whatsapp: string;
  package_type: PackageType;
  item_title: string;
  original_price: number;
  price: number;
  discount_amount: number;
  coupon_code?: string | null;
  unique_code: number;
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  notes?: string | null;
  affiliate_code?: string | null;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
  last_followed_up_at?: string | null;
  last_followed_up_by?: 'admin' | 'affiliate' | string | null;
  last_followed_up_note?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  min_purchase_amount?: number | null;
  max_uses?: number | null;
  used_count: number;
  start_date?: string | null;
  end_date?: string | null;
  applicable_to: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentSettings {
  id?: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  qris_image_url?: string | null;
  whatsapp_number: string;
  instructions?: string;
  is_active?: boolean;
  updated_at?: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bank_name: 'BCA',
  bank_account_number: '1234567890',
  bank_account_holder: 'Admin ModulAjar',
  whatsapp_number: '6288228511309',
  instructions: 'Silakan transfer sesuai nominal total tagihan (termasuk 3 digit kode unik) agar verifikasi pembayaran berjalan cepat.',
  is_active: true,
};
