import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AccountType = 'lifetime' | 'annual' | 'trial' | 'regular' | 'pro_annual' | 'pro_lifetime' | 'unknown';

export interface SubscriptionStatus {
  accountType: AccountType;
  expiresAt: string | null;
  daysLeft: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean; // <= 30 days
  isCritical: boolean;     // <= 7 days or expired
  isLifetime: boolean;
  isAnnual: boolean;
  isTrial: boolean;
  isPro: boolean;
}

export const useSubscriptionStatus = () => {
  const { user } = useAuth();

  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription-status', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('allowed_customers')
        .select('account_type, subscription_expires_at')
        .eq('email', user!.email)
        .maybeSingle();

      const accountType = ((data as any)?.account_type ?? 'unknown') as AccountType;
      const expiresAt = (data as any)?.subscription_expires_at ?? null;

      let daysLeft: number | null = null;
      let isExpired = false;
      if ((accountType === 'annual' || accountType === 'pro_annual') && expiresAt) {
        const diffMs = new Date(expiresAt).getTime() - Date.now();
        daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        isExpired = diffMs <= 0;
      }

      const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 7;
      const isCritical = daysLeft !== null && (daysLeft <= 7 || isExpired);

      return {
        accountType,
        expiresAt,
        daysLeft,
        isExpired,
        isExpiringSoon,
        isCritical,
        isLifetime: accountType === 'lifetime' || accountType === 'regular' || accountType === 'pro_lifetime',
        isAnnual: accountType === 'annual' || accountType === 'pro_annual',
        isTrial: accountType === 'trial',
        isPro: accountType === 'pro_annual' || accountType === 'pro_lifetime',
      };
    },
  });
};
