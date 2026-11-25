import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coupon, DiscountType } from '@/types/orders';
import { toast } from 'sonner';

export const COUPONS_QUERY_KEY = 'app_coupons';

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  discountAmount: number;
  finalPrice: number;
  coupon?: Coupon;
}

/**
 * Helper to check whether a coupon is applicable to a specific package type
 * Supports multi-variant comma-separated packages (e.g. 'lite,standar', 'standar,pro', 'all')
 */
export function isCouponApplicableToPackage(
  applicableTo?: string | null,
  packageType?: string
): boolean {
  if (!applicableTo || applicableTo === 'all' || applicableTo === 'subscription') {
    return true;
  }
  if (!packageType) return true;

  const pkg = packageType.toLowerCase().trim();
  const tokens = applicableTo.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean);

  if (tokens.length === 0 || tokens.includes('all') || tokens.includes('subscription')) {
    return true;
  }

  // Alias mapping:
  // 'lite' matches 'lite'
  // 'standar' matches 'standar' or 'annual'
  // 'pro' matches 'pro' or 'pro_annual'
  const packageAliases: Record<string, string[]> = {
    lite: ['lite'],
    standar: ['standar', 'annual'],
    annual: ['standar', 'annual'],
    pro: ['pro', 'pro_annual'],
    pro_annual: ['pro', 'pro_annual'],
  };

  const allowedAliases = packageAliases[pkg] || [pkg];
  return tokens.some((token) => allowedAliases.includes(token));
}

/**
 * Helper to format human-readable names of packages a coupon applies to
 */
export function getApplicablePackageNames(applicableTo?: string | null): string {
  if (!applicableTo || applicableTo === 'all' || applicableTo === 'subscription') {
    return 'Semua Paket';
  }
  const tokens = applicableTo.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean);
  const names: string[] = [];
  if (tokens.some((t) => t === 'lite')) names.push('Paket Lite');
  if (tokens.some((t) => t === 'standar' || t === 'annual')) names.push('Paket Standar');
  if (tokens.some((t) => t === 'pro' || t === 'pro_annual')) names.push('Paket Pro');

  if (names.length === 3) return 'Semua Paket';
  if (names.length === 0) return applicableTo;
  return names.join(' & ');
}

/**
 * Validates a coupon code against an item price and package type
 */
export function validateCouponCode(
  coupons: Coupon[],
  code: string,
  price: number,
  packageType?: string
): CouponValidationResult {
  if (!code || !code.trim()) {
    return { valid: false, discountAmount: 0, finalPrice: price, message: 'Kode voucher kosong' };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return { valid: false, discountAmount: 0, finalPrice: price, message: 'Kode kupon tidak ditemukan' };
  }

  if (!coupon.is_active) {
    return { valid: false, discountAmount: 0, finalPrice: price, message: 'Kupon ini sudah tidak aktif' };
  }

  const now = new Date();
  if (coupon.start_date && new Date(coupon.start_date) > now) {
    return { valid: false, discountAmount: 0, finalPrice: price, message: 'Kupon belum dapat digunakan' };
  }

  if (coupon.end_date && new Date(coupon.end_date) < now) {
    return { valid: false, discountAmount: 0, finalPrice: price, message: 'Masa berlaku kupon telah berakhir' };
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { valid: false, discountAmount: 0, finalPrice: price, message: 'Kuota pemakaian kupon telah habis' };
  }

  if (coupon.min_purchase_amount && price < coupon.min_purchase_amount) {
    return {
      valid: false,
      discountAmount: 0,
      finalPrice: price,
      message: `Minimal pembelian Rp ${coupon.min_purchase_amount.toLocaleString('id-ID')} untuk kupon ini`,
    };
  }

  if (coupon.applicable_to && !isCouponApplicableToPackage(coupon.applicable_to, packageType)) {
    return {
      valid: false,
      discountAmount: 0,
      finalPrice: price,
      message: `Kupon ini hanya berlaku untuk ${getApplicablePackageNames(coupon.applicable_to)}`,
    };
  }

  // Calculate discount amount
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.round((price * coupon.discount_value) / 100);
    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
      discount = coupon.max_discount_amount;
    }
  } else {
    discount = Math.min(coupon.discount_value, price);
  }

  const finalPrice = Math.max(0, price - discount);

  return {
    valid: true,
    discountAmount: discount,
    finalPrice,
    coupon,
    message: `Kupon "${coupon.code}" berhasil diterapkan! Hemat Rp ${discount.toLocaleString('id-ID')}`,
  };
}

/**
 * Increment coupon used count in DB
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  if (!code) return;
  try {
    const cleanCode = code.trim().toUpperCase();
    const { data: coupon } = await supabase
      .from('coupons' as any)
      .select('id, used_count')
      .eq('code', cleanCode)
      .maybeSingle();

    if (coupon) {
      await supabase
        .from('coupons' as any)
        .update({
          used_count: ((coupon as any).used_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (coupon as any).id);
    }
  } catch (err) {
    console.warn('Could not increment coupon count:', err);
  }
}

export function useCoupons() {
  return useQuery({
    queryKey: [COUPONS_QUERY_KEY],
    queryFn: async (): Promise<Coupon[]> => {
      try {
        const { data, error } = await supabase
          .from('coupons' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch remote coupons:', error.message);
          return [];
        }

        return (data || []) as Coupon[];
      } catch (err) {
        console.warn('Coupons query exception:', err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Coupon, 'id' | 'used_count' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('coupons' as any)
        .insert({
          ...input,
          code: input.code.trim().toUpperCase(),
          used_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY] });
      toast.success('Kupon baru berhasil dibuat');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membuat kupon');
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Coupon> }) => {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      if (updates.code) {
        payload.code = updates.code.trim().toUpperCase();
      }

      const { data, error } = await supabase
        .from('coupons' as any)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY] });
      toast.success('Kupon berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal mengupdate kupon');
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY] });
      toast.success('Kupon berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus kupon');
    },
  });
}
