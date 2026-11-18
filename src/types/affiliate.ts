export interface AffiliateSettings {
  id?: string;
  default_commission_rate: number;
  min_payout_free_fee: number;
  below_min_admin_fee: number;
  trial_quota_per_user: number;
  max_trials_per_month: number;
  is_program_active: boolean;
  leaderboard_period_title: string;
  leaderboard_start_date?: string | null;
  leaderboard_end_date?: string | null;
  updated_at?: string;
}

export const DEFAULT_AFFILIATE_SETTINGS: AffiliateSettings = {
  default_commission_rate: 40,
  min_payout_free_fee: 50000,
  below_min_admin_fee: 2500,
  trial_quota_per_user: 25,
  max_trials_per_month: 30,
  is_program_active: true,
  leaderboard_period_title: 'Top 5 Afiliator Bulan Ini',
};

export interface Affiliate {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  affiliate_code: string;
  whatsapp?: string | null;
  commission_rate: number;
  max_trials_per_month?: number | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_holder?: string | null;
  is_active: boolean;
  total_clicks: number;
  created_at: string;
  updated_at: string;
}

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  order_id?: string | null;
  customer_email: string;
  customer_name?: string | null;
  package_type: string;
  is_renewal: boolean;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: CommissionStatus;
  payout_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type PayoutStatus = 'pending' | 'paid' | 'rejected';

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  requested_amount: number;
  admin_fee: number;
  net_amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  status: PayoutStatus;
  admin_notes?: string | null;
  transfer_reference?: string | null;
  requested_at: string;
  paid_at?: string | null;
  updated_at: string;
}

export type MarketingKitCategory = 'copywriting' | 'banner' | 'video' | 'presentasi' | 'lainnya';

export interface AffiliateMarketingKit {
  id: string;
  title: string;
  category: MarketingKitCategory;
  description?: string | null;
  content_text?: string | null;
  asset_url?: string | null;
  thumbnail_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeaderboardEntry {
  affiliate_id: string;
  display_name: string;
  affiliate_code: string;
  total_conversions: number;
  total_commission: number;
  rank_position: number;
}

export interface AffiliateLead {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  account_type: string;
  is_claimed: boolean;
  user_id: string | null;
  subscription_expires_at: string | null;
  referred_by_affiliate_id: string | null;
  referred_by_code: string | null;
  trial_quota_limit: number | null;
  created_at: string;
  generation_count?: number;
}

export const ELIGIBLE_AFFILIATE_ACCOUNT_TYPES = [
  'annual',
  'pro_annual',
  'lifetime',
  'regular',
  'pro_lifetime',
];

export function isEligibleAccountTypeForAffiliate(accountType?: string | null): boolean {
  if (!accountType) return false;
  return ELIGIBLE_AFFILIATE_ACCOUNT_TYPES.includes(accountType.toLowerCase());
}
