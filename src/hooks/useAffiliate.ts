import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Affiliate,
  AffiliateSettings,
  DEFAULT_AFFILIATE_SETTINGS,
  AffiliateCommission,
  AffiliatePayout,
  AffiliateMarketingKit,
  LeaderboardEntry,
  AffiliateLead,
  AffiliateReferralOrder,
  isEligibleAccountTypeForAffiliate,
} from '@/types/affiliate';
import { PACKAGES_CONFIG } from '@/types/orders';
import { generateInvoiceCode, calculateSubscriptionExpiry, normalizeAccountType } from '@/hooks/useOrders';
import { CustomerActivationInfo } from '@/components/admin/ActivationMessageModal';
import { toast } from 'sonner';

export const AFFILIATE_SETTINGS_KEY = 'affiliate-settings';
export const MY_AFFILIATE_KEY = 'my-affiliate';
export const MY_AFFILIATE_LEADS_KEY = 'my-affiliate-leads';
export const MY_AFFILIATE_COMMISSIONS_KEY = 'my-affiliate-commissions';
export const MY_AFFILIATE_ORDERS_KEY = 'my-affiliate-orders';
export const MY_AFFILIATE_PAYOUTS_KEY = 'my-affiliate-payouts';
export const AFFILIATE_LEADERBOARD_KEY = 'affiliate-leaderboard';
export const AFFILIATE_MARKETING_KITS_KEY = 'affiliate-marketing-kits';
export const ADMIN_AFFILIATES_KEY = 'admin-affiliates';
export const ADMIN_AFFILIATE_LEADS_KEY = 'admin-affiliate-leads';
export const ADMIN_AFFILIATE_PAYOUTS_KEY = 'admin-affiliate-payouts';
export const ADMIN_AFFILIATE_COMMISSIONS_KEY = 'admin-affiliate-commissions';

/**
 * Generate a clean default referral code from display name or email
 */
export function generateAffiliateCode(nameOrEmail: string): string {
  const base = (nameOrEmail || 'GURU')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6) || 'GURU';
  const rand = Math.floor(100 + Math.random() * 899);
  return `${base}${rand}`;
}

/**
 * 1. Global Affiliate Settings
 */
export function useAffiliateSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [AFFILIATE_SETTINGS_KEY],
    queryFn: async (): Promise<AffiliateSettings> => {
      const { data, error } = await (supabase as any)
        .from('affiliate_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) return DEFAULT_AFFILIATE_SETTINGS;
      return data as AffiliateSettings;
    },
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AffiliateSettings>) => {
      const now = new Date().toISOString();
      const currentId = query.data?.id;
      if (currentId) {
        const { error } = await (supabase as any)
          .from('affiliate_settings')
          .update({ ...updates, updated_at: now })
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('affiliate_settings')
          .insert({ ...DEFAULT_AFFILIATE_SETTINGS, ...updates, updated_at: now });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATE_SETTINGS_KEY] });
      toast.success('Pengaturan program afiliasi berhasil disimpan');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menyimpan pengaturan afiliasi'),
  });

  return {
    settings: query.data || DEFAULT_AFFILIATE_SETTINGS,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * 2. Current User's Affiliate Profile, Eligibility & Active API Key Count
 */
export function useMyAffiliate() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: [MY_AFFILIATE_KEY, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) {
        return {
          affiliate: null as Affiliate | null,
          isEligible: false,
          accountType: null as string | null,
          activeApiKeyCount: 0,
        };
      }

      // Check customer account type (Standar/Pro/Lifetime eligible; Lite & Trial not eligible)
      let { data: customer } = await supabase
        .from('allowed_customers')
        .select('account_type, subscription_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer && user.email) {
        const { data: byEmail } = await supabase
          .from('allowed_customers')
          .select('account_type, subscription_expires_at')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();
        customer = byEmail;
      }

      const isExpired =
        customer?.subscription_expires_at &&
        new Date(customer.subscription_expires_at).getTime() < Date.now();
      const accountType = customer?.account_type || null;
      const isEligible =
        isAdmin ||
        user.email?.toLowerCase() === 'jagofeed@gmail.com' ||
        (!isExpired && isEligibleAccountTypeForAffiliate(accountType));

      // Check affiliate profile
      const { data: affiliateData } = await (supabase as any)
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Count user's active Gemini/provider API keys
      const { count: keyCount } = await supabase
        .from('user_api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      return {
        affiliate: (affiliateData as Affiliate) || null,
        isEligible,
        accountType,
        activeApiKeyCount: keyCount ?? 0,
      };
    },
    staleTime: 15 * 1000,
  });
}

/**
 * 3. Self-register (auto-activate) as Affiliate
 */
export function useRegisterAffiliate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      display_name: string;
      affiliate_code?: string;
      whatsapp?: string;
      bank_name?: string;
      bank_account_number?: string;
      bank_account_holder?: string;
    }) => {
      if (!user || !user.email) throw new Error('Anda harus login terlebih dahulu');

      const { data: settingsData } = await (supabase as any)
        .from('affiliate_settings')
        .select('default_commission_rate')
        .limit(1)
        .maybeSingle();

      const commissionRate = settingsData?.default_commission_rate ?? 40;
      const cleanCode = (input.affiliate_code?.trim() || generateAffiliateCode(input.display_name || user.email))
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .toUpperCase();

      if (cleanCode.length < 3) {
        throw new Error('Kode afiliasi minimal 3 karakter (huruf/angka)');
      }

      const { data, error } = await (supabase as any)
        .from('affiliates')
        .insert({
          user_id: user.id,
          email: user.email.toLowerCase().trim(),
          display_name: input.display_name.trim(),
          affiliate_code: cleanCode,
          whatsapp: input.whatsapp?.trim() || null,
          commission_rate: commissionRate,
          bank_name: input.bank_name?.trim() || null,
          bank_account_number: input.bank_account_number?.trim() || null,
          bank_account_holder: input.bank_account_holder?.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Kode afiliasi tersebut sudah digunakan oleh orang lain. Silakan pilih kode unik lainnya.');
        }
        throw error;
      }

      return data as Affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_KEY] });
      toast.success('Akun Afiliator Anda langsung aktif! Komisi 40% siap mengalir 🎉');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mengaktifkan akun afiliator'),
  });
}

/**
 * 4. Update own affiliate profile (bank details, WA, display name, code)
 */
export function useUpdateMyAffiliate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Pick<
          Affiliate,
          'display_name' | 'whatsapp' | 'bank_name' | 'bank_account_number' | 'bank_account_holder' | 'affiliate_code'
        >
      >;
    }) => {
      const payload: Record<string, any> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      if (updates.affiliate_code) {
        payload.affiliate_code = updates.affiliate_code.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
      }
      const { error } = await (supabase as any)
        .from('affiliates')
        .update(payload)
        .eq('id', id);

      if (error) {
        if (error.code === '23505') throw new Error('Kode afiliasi sudah dipakai orang lain.');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_KEY] });
      toast.success('Profil & rekening afiliator berhasil diperbarui');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui profil afiliator'),
  });
}

/**
 * 5. Affiliate's Referred Leads (Trial & Upgraded) with live generation usage count
 */
export function useMyAffiliateLeads(affiliateId?: string) {
  return useQuery({
    queryKey: [MY_AFFILIATE_LEADS_KEY, affiliateId],
    enabled: !!affiliateId,
    queryFn: async (): Promise<AffiliateLead[]> => {
      const { data: leads, error } = await (supabase as any)
        .from('allowed_customers')
        .select(
          'id, email, name, phone, account_type, is_claimed, user_id, subscription_expires_at, referred_by_affiliate_id, referred_by_code, trial_quota_limit, created_at'
        )
        .eq('referred_by_affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usage counts safely via RPC
      const usageMap = new Map<string, number>();
      try {
        const { data: usageRows } = await (supabase as any).rpc('get_affiliate_leads_usage', {
          p_affiliate_id: affiliateId,
        });
        (usageRows || []).forEach((r: any) => {
          usageMap.set(r.customer_id, Number(r.generation_count || 0));
        });
      } catch {
        // non-critical
      }

      return ((leads || []) as AffiliateLead[]).map((l) => ({
        ...l,
        generation_count: usageMap.get(l.id) ?? 0,
      }));
    },
    staleTime: 15 * 1000,
  });
}

/**
 * 6. Register 1 or Bulk Trial Users by Affiliate (using Affiliate's API Key!)
 */
export function useRegisterAffiliateTrialLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      affiliate,
      settings,
      activeApiKeyCount,
      existingLeadsThisMonth,
      entries,
    }: {
      affiliate: Affiliate;
      settings: AffiliateSettings;
      activeApiKeyCount: number;
      existingLeadsThisMonth: number;
      entries: Array<{ email: string; name?: string; phone?: string }>;
    }) => {
      if (activeApiKeyCount <= 0) {
        throw new Error(
          'Anda belum memasang Gemini API Key aktif. Pasang API Key Anda di Pengaturan terlebih dahulu agar user trial binaan dapat menggunakan aplikasi.'
        );
      }

      const maxPerMonth = affiliate.max_trials_per_month ?? settings.max_trials_per_month ?? 30;
      const quotaPerUser = settings.trial_quota_per_user ?? 25;

      // Deduplicate & clean input
      const cleanMap = new Map<string, { email: string; name: string; phone: string | null }>();
      for (const e of entries) {
        const email = e.email.toLowerCase().trim();
        if (!email || !email.includes('@')) continue;
        if (email === affiliate.email.toLowerCase().trim()) continue; // prevent self-referral
        const defaultName = email.split('@')[0].replace(/[._-]+/g, ' ');
        const formattedName =
          e.name?.trim() ||
          defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
        cleanMap.set(email, {
          email,
          name: formattedName,
          phone: e.phone?.trim() || null,
        });
      }

      const uniqueEntries = Array.from(cleanMap.values());
      if (uniqueEntries.length === 0) {
        throw new Error('Tidak ada alamat email valid untuk didaftarkan.');
      }

      const remainingSlots = Math.max(0, maxPerMonth - existingLeadsThisMonth);
      if (uniqueEntries.length > remainingSlots) {
        throw new Error(
          `Kuota pendaftaran trial bulan ini tersisa ${remainingSlots} email (batas ${maxPerMonth}/bulan). Anda mencoba mendaftarkan ${uniqueEntries.length} email.`
        );
      }

      const insertedEmails: string[] = [];
      const skippedEmails: string[] = [];

      for (const item of uniqueEntries) {
        const { error } = await (supabase as any)
          .from('allowed_customers')
          .insert({
            email: item.email,
            name: item.name,
            phone: item.phone,
            account_type: 'trial',
            subscription_expires_at: null,
            referred_by_affiliate_id: affiliate.id,
            referred_by_code: affiliate.affiliate_code,
            trial_quota_limit: quotaPerUser,
          });

        if (error) {
          if (error.code === '23505') {
            skippedEmails.push(item.email);
          } else {
            throw error;
          }
        } else {
          insertedEmails.push(item.email);
        }
      }

      return { insertedEmails, skippedEmails };
    },
    onSuccess: ({ insertedEmails, skippedEmails }) => {
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_LEADS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_AFFILIATE_LEADS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
      if (insertedEmails.length > 0 && skippedEmails.length > 0) {
        toast.success(
          `${insertedEmails.length} email trial berhasil didaftarkan (${skippedEmails.length} sudah terdaftar sebelumnya).`
        );
      } else if (insertedEmails.length > 0) {
        toast.success(`${insertedEmails.length} akun trial berhasil didaftarkan!`);
      } else {
        toast.info('Semua email tersebut sudah terdaftar di sistem sebelumnya.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mendaftarkan akun trial'),
  });
}

/**
 * 7. Affiliate Commissions & Payouts (Self)
 */
export function useMyAffiliateCommissions(affiliateId?: string) {
  return useQuery({
    queryKey: [MY_AFFILIATE_COMMISSIONS_KEY, affiliateId],
    enabled: !!affiliateId,
    queryFn: async (): Promise<AffiliateCommission[]> => {
      const { data, error } = await (supabase as any)
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateCommission[];
    },
    staleTime: 15 * 1000,
  });
}

export function useMyAffiliatePayouts(affiliateId?: string) {
  return useQuery({
    queryKey: [MY_AFFILIATE_PAYOUTS_KEY, affiliateId],
    enabled: !!affiliateId,
    queryFn: async (): Promise<AffiliatePayout[]> => {
      const { data, error } = await (supabase as any)
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliatePayout[];
    },
    staleTime: 15 * 1000,
  });
}

export function useRequestAffiliatePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      affiliate,
      settings,
      requestedAmount,
      availableBalance,
    }: {
      affiliate: Affiliate;
      settings: AffiliateSettings;
      requestedAmount: number;
      availableBalance: number;
    }) => {
      if (requestedAmount <= 0) throw new Error('Nominal pencairan harus lebih dari Rp 0');
      if (requestedAmount > availableBalance) {
        throw new Error(`Nominal melebihi saldo siap cair (Rp ${availableBalance.toLocaleString('id-ID')})`);
      }
      if (!affiliate.bank_name || !affiliate.bank_account_number || !affiliate.bank_account_holder) {
        throw new Error('Lengkapi data rekening bank / e-wallet Anda terlebih dahulu sebelum mengajukan pencairan.');
      }

      const isBelowFreeMin = requestedAmount < (settings.min_payout_free_fee ?? 50000);
      const adminFee = isBelowFreeMin ? (settings.below_min_admin_fee ?? 2500) : 0;
      const netAmount = requestedAmount - adminFee;

      if (netAmount <= 0) {
        throw new Error(
          `Nominal pencairan harus lebih besar dari biaya admin transfer (Rp ${adminFee.toLocaleString('id-ID')}).`
        );
      }

      const { error } = await (supabase as any)
        .from('affiliate_payouts')
        .insert({
          affiliate_id: affiliate.id,
          requested_amount: requestedAmount,
          admin_fee: adminFee,
          net_amount: netAmount,
          bank_name: affiliate.bank_name,
          bank_account_number: affiliate.bank_account_number,
          bank_account_holder: affiliate.bank_account_holder,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_PAYOUTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_AFFILIATE_PAYOUTS_KEY] });
      toast.success('Pengajuan pencairan komisi berhasil dikirim! Admin akan segera memprosesnya.');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mengajukan pencairan komisi'),
  });
}

/**
 * 7b. Affiliate's Referral Orders (Pending & Paid) via RPC get_affiliate_referral_orders
 */
export function useMyAffiliateReferralOrders(affiliateId?: string) {
  return useQuery({
    queryKey: [MY_AFFILIATE_ORDERS_KEY, affiliateId],
    enabled: !!affiliateId,
    queryFn: async (): Promise<AffiliateReferralOrder[]> => {
      const { data, error } = await (supabase as any).rpc('get_affiliate_referral_orders', {
        p_affiliate_id: affiliateId,
      });

      if (error) {
        console.warn('get_affiliate_referral_orders RPC error:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        order_id: row.order_id,
        invoice: row.invoice,
        buyer_name: row.buyer_name,
        buyer_email: row.buyer_email,
        buyer_whatsapp: row.buyer_whatsapp,
        package_type: row.package_type,
        item_title: row.item_title,
        price: Number(row.price || 0),
        discount_amount: Number(row.discount_amount || 0),
        total_amount: Number(row.total_amount || 0),
        unique_code: Number(row.unique_code || 0),
        status: row.status,
        affiliate_code: row.affiliate_code,
        created_at: row.created_at,
        paid_at: row.paid_at,
        last_followed_up_at: row.last_followed_up_at,
        last_followed_up_by: row.last_followed_up_by,
        last_followed_up_note: row.last_followed_up_note,
        estimated_commission: Number(row.estimated_commission || 0),
      }));
    },
    staleTime: 10 * 1000,
  });
}

/**
 * Mark order as followed up by affiliate or admin
 */
export function useMarkOrderFollowedUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      by = 'affiliate',
      note,
    }: {
      orderId: string;
      by?: 'affiliate' | 'admin';
      note?: string;
    }) => {
      const { data, error } = await (supabase as any).rpc('mark_order_followed_up', {
        p_order_id: orderId,
        p_by: by,
        p_note: note || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}

/**
 * 8. Global Leaderboard (Top 5 + Self Rank)
 */
export function useAffiliateLeaderboard(period: 'month' | 'week' | 'contest' | 'all' = 'month') {
  return useQuery({
    queryKey: [AFFILIATE_LEADERBOARD_KEY, period],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await (supabase as any).rpc('get_affiliate_leaderboard', {
        p_period: period,
      });
      if (error) {
        console.warn('Leaderboard RPC error:', error.message);
        return [];
      }
      return (data || []).map((row: any) => ({
        affiliate_id: row.affiliate_id,
        display_name: row.display_name,
        affiliate_code: row.affiliate_code,
        total_conversions: Number(row.total_conversions || 0),
        total_commission: Number(row.total_commission || 0),
        rank_position: Number(row.rank_position || 0),
      }));
    },
    staleTime: 30 * 1000,
  });
}

/**
 * 9. Marketing Kits (Read by Affiliates, CRUD by Admin)
 */
export function useAffiliateMarketingKits() {
  return useQuery({
    queryKey: [AFFILIATE_MARKETING_KITS_KEY],
    queryFn: async (): Promise<AffiliateMarketingKit[]> => {
      const { data, error } = await (supabase as any)
        .from('affiliate_marketing_kits')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateMarketingKit[];
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateMarketingKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<AffiliateMarketingKit, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await (supabase as any)
        .from('affiliate_marketing_kits')
        .insert({ ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATE_MARKETING_KITS_KEY] });
      toast.success('Materi Marketing Kit berhasil ditambahkan');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menambah Marketing Kit'),
  });
}

export function useUpdateMarketingKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AffiliateMarketingKit> }) => {
      const { error } = await (supabase as any)
        .from('affiliate_marketing_kits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATE_MARKETING_KITS_KEY] });
      toast.success('Marketing Kit berhasil diperbarui');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui Marketing Kit'),
  });
}

export function useDeleteMarketingKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('affiliate_marketing_kits')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AFFILIATE_MARKETING_KITS_KEY] });
      toast.success('Marketing Kit berhasil dihapus');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menghapus Marketing Kit'),
  });
}

/**
 * 10. ADMIN HOOKS: Manage Affiliates, Leads, Commissions & Payouts
 */
export function useAdminAffiliates() {
  return useQuery({
    queryKey: [ADMIN_AFFILIATES_KEY],
    queryFn: async (): Promise<Affiliate[]> => {
      const { data, error } = await (supabase as any)
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Affiliate[];
    },
    staleTime: 15 * 1000,
  });
}

export function useAdminUpdateAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Affiliate> }) => {
      const { error } = await (supabase as any)
        .from('affiliates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_AFFILIATES_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_KEY] });
      toast.success('Data afiliator berhasil diperbarui');
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui afiliator'),
  });
}

export function useAdminAffiliateLeads() {
  return useQuery({
    queryKey: [ADMIN_AFFILIATE_LEADS_KEY],
    queryFn: async (): Promise<AffiliateLead[]> => {
      const { data, error } = await (supabase as any)
        .from('allowed_customers')
        .select(
          'id, email, name, phone, account_type, is_claimed, user_id, subscription_expires_at, referred_by_affiliate_id, referred_by_code, trial_quota_limit, created_at'
        )
        .not('referred_by_affiliate_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateLead[];
    },
    staleTime: 15 * 1000,
  });
}

export function useAdminAffiliateCommissions() {
  return useQuery({
    queryKey: [ADMIN_AFFILIATE_COMMISSIONS_KEY],
    queryFn: async (): Promise<AffiliateCommission[]> => {
      const { data, error } = await (supabase as any)
        .from('affiliate_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateCommission[];
    },
    staleTime: 15 * 1000,
  });
}

export function useAdminAffiliatePayouts() {
  return useQuery({
    queryKey: [ADMIN_AFFILIATE_PAYOUTS_KEY],
    queryFn: async (): Promise<AffiliatePayout[]> => {
      const { data, error } = await (supabase as any)
        .from('affiliate_payouts')
        .select('*')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliatePayout[];
    },
    staleTime: 15 * 1000,
  });
}

/**
 * Admin Action: Activate Affiliate's Trial Lead to Paid Tier ("Tombol Centang")
 * - Upgrades allowed_customers to lite / annual / pro_annual
 * - Records paid Order in orders table
 * - Automatically records 40% commission for the affiliate!
 */
export function useAdminActivateAffiliateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lead,
      affiliate,
      packageKey,
      customPrice,
    }: {
      lead: AffiliateLead;
      affiliate: Affiliate;
      packageKey: 'lite' | 'standar' | 'pro';
      customPrice?: number;
    }): Promise<CustomerActivationInfo> => {
      const pkg = PACKAGES_CONFIG[packageKey] || PACKAGES_CONFIG.standar;
      const accountType = normalizeAccountType(packageKey);
      const isRenewal = lead.account_type !== 'trial';
      const newExpiry = calculateSubscriptionExpiry(
        packageKey,
        isRenewal ? lead.subscription_expires_at : null
      );
      const now = new Date().toISOString();

      // 1. Update allowed_customers to active paid tier
      const { error: custErr } = await supabase
        .from('allowed_customers')
        .update({
          account_type: accountType,
          subscription_expires_at: newExpiry,
          updated_at: now,
        })
        .eq('id', lead.id);

      if (custErr) throw new Error(`Gagal mengaktifkan akun: ${custErr.message}`);

      // 2. Record paid order for revenue & bookkeeping
      const orderPrice = typeof customPrice === 'number' && customPrice >= 0 ? customPrice : pkg.price;
      const invoice = generateInvoiceCode();

      const { data: orderData, error: orderErr } = await (supabase as any)
        .from('orders')
        .insert({
          invoice,
          user_id: lead.user_id || null,
          buyer_name: lead.name,
          buyer_email: lead.email.toLowerCase().trim(),
          buyer_whatsapp: lead.phone || '-',
          package_type: packageKey,
          item_title: pkg.name,
          original_price: pkg.originalPrice,
          price: orderPrice,
          discount_amount: 0,
          unique_code: 0,
          total_amount: orderPrice,
          payment_method: 'manual_transfer',
          status: 'paid',
          notes: `Aktivasi langsung dari prospek trial afiliator (${affiliate.display_name})`,
          affiliate_code: affiliate.affiliate_code,
          created_at: now,
          updated_at: now,
          paid_at: now,
        })
        .select('id')
        .single();

      if (orderErr) {
        console.warn('Could not insert order log for direct lead activation:', orderErr);
      }

      // 3. Record Affiliate Commission (40% or affiliate's custom rate)
      if (lead.email.toLowerCase().trim() !== affiliate.email.toLowerCase().trim()) {
        const rate = Number(affiliate.commission_rate ?? 40);
        const commissionAmount = Math.round((orderPrice * rate) / 100);

        const { error: commErr } = await (supabase as any)
          .from('affiliate_commissions')
          .insert({
            affiliate_id: affiliate.id,
            order_id: orderData?.id || null,
            customer_email: lead.email.toLowerCase().trim(),
            customer_name: lead.name,
            package_type: packageKey,
            is_renewal: isRenewal,
            order_amount: orderPrice,
            commission_rate: rate,
            commission_amount: commissionAmount,
            status: 'approved',
            notes: `Aktivasi ${pkg.name} oleh Admin (#${invoice})`,
            created_at: now,
            updated_at: now,
          });

        if (commErr) {
          throw new Error(`Akun aktif, tetapi gagal mencatat komisi afiliasi: ${commErr.message}`);
        }
      }

      return {
        id: lead.id,
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        account_type: accountType,
        subscription_expires_at: newExpiry,
      };
    },
    onSuccess: (info) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_AFFILIATE_LEADS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_AFFILIATE_COMMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_LEADS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_COMMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [AFFILIATE_LEADERBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`Akun ${info.email} berhasil diaktifkan & komisi afiliator otomatis tercatat!`);
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mengaktifkan prospek afiliator'),
  });
}

/**
 * Admin Action: Mark Payout as Paid or Rejected
 */
export function useAdminProcessPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payout,
      status,
      transferReference,
      adminNotes,
    }: {
      payout: AffiliatePayout;
      status: 'paid' | 'rejected';
      transferReference?: string;
      adminNotes?: string;
    }) => {
      const now = new Date().toISOString();

      const { error } = await (supabase as any)
        .from('affiliate_payouts')
        .update({
          status,
          transfer_reference: transferReference?.trim() || null,
          admin_notes: adminNotes?.trim() || null,
          paid_at: status === 'paid' ? now : null,
          updated_at: now,
        })
        .eq('id', payout.id);

      if (error) throw error;

      // If marked paid, link approved commissions up to requested_amount to this payout
      if (status === 'paid') {
        const { data: approvedComms } = await (supabase as any)
          .from('affiliate_commissions')
          .select('id, commission_amount')
          .eq('affiliate_id', payout.affiliate_id)
          .eq('status', 'approved')
          .is('payout_id', null)
          .order('created_at', { ascending: true });

        let remainingToCover = Number(payout.requested_amount);
        const toMarkIds: string[] = [];

        for (const c of approvedComms || []) {
          if (remainingToCover <= 0) break;
          toMarkIds.push(c.id);
          remainingToCover -= Number(c.commission_amount || 0);
        }

        if (toMarkIds.length > 0) {
          await (supabase as any)
            .from('affiliate_commissions')
            .update({ status: 'paid', payout_id: payout.id, updated_at: now })
            .in('id', toMarkIds);
        }
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_AFFILIATE_PAYOUTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_AFFILIATE_COMMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_PAYOUTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_AFFILIATE_COMMISSIONS_KEY] });
      toast.success(
        vars.status === 'paid'
          ? 'Pencairan komisi ditandai SUDAH DITRANSFER!'
          : 'Pengajuan pencairan telah ditolak.'
      );
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memproses pencairan komisi'),
  });
}
