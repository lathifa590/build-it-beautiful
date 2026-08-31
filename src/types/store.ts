export type StoreStatus = 'ACTIVE' | 'BANNED' | 'PRIVAT';
export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'TAKEDOWN';
export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_REVIEW' | 'SELESAI' | 'BATAL';
export type DiscountType = 'PERCENTAGE' | 'NOMINAL';

export interface StoreProfile {
  store_id: string;
  owner_user_id: string;
  store_name: string;
  store_slug: string;
  tagline?: string;
  description?: string;
  category?: string;
  avatar_url?: string;
  banner_desktop_url?: string;
  banner_mobile_url?: string;
  primary_color: string;
  status: StoreStatus;
  created_at: string;
  updated_at: string;
}

export interface StoreListing {
  listing_id: string;
  store_id: string;
  workspace_id?: string;
  history_id?: string;
  title: string;
  description?: string;
  category?: string;
  price_amount: number;
  normal_price_amount: number;
  status: ListingStatus;
  preview_image_url?: string;
  url_modul_ajar?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  store_profile?: StoreProfile;
}

export interface StoreOrder {
  order_id: string;
  invoice_number: string;
  store_id: string;
  listing_id: string;
  buyer_email: string;
  buyer_name: string;
  buyer_whatsapp?: string;
  total_amount: number;
  coupon_code_used?: string;
  status: OrderStatus;
  payment_proof_url?: string;
  uploaded_at?: string;
  created_at: string;
  completed_at?: string;
  listing?: StoreListing;
}

export interface StoreCoupon {
  coupon_id: string;
  store_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number;
  max_discount: number;
  starts_at?: string;
  expires_at?: string;
  usage_limit: number;
  used_count: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface StoreMetrics {
  id: number;
  date: string;
  store_id: string;
  listing_id?: string;
  store_views: number;
  product_views: number;
  checkout_started: number;
  orders_completed: number;
  revenue_amount: number;
}
