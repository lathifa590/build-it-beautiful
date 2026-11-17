import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { useGeminiKeys } from './useGeminiKeys';
import { PAID_ONBOARDING_LIMIT, type TrialQuotaInfo } from './useTrialQuota';

export function useOnboardingQuota() {
  const { user, isAdmin } = useAuth();
  const { data: subStatus } = useSubscriptionStatus();
  const { hasActiveKey, loading: loadingKeys } = useGeminiKeys();

  const isTrial = subStatus?.isTrial ?? false;
  const isSuperAdmin = isAdmin || user?.email?.toLowerCase() === 'jagofeed@gmail.com';
  // User berbayar yang belum memasang API Key pribadi dan bukan admin/superadmin
  const isOnboarding = !isTrial && !!user?.id && !isSuperAdmin && !loadingKeys && !hasActiveKey;

  const query = useQuery<TrialQuotaInfo | null>({
    queryKey: ['onboarding-quota', user?.id],
    enabled: isOnboarding,
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('generation_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .neq('content_type', 'image');

        if (error) {
          console.warn('[useOnboardingQuota] Error counting logs:', error);
          return {
            remaining: PAID_ONBOARDING_LIMIT,
            limit: PAID_ONBOARDING_LIMIT,
            isTrial: false,
            isOnboardingQuota: true,
          };
        }

        const totalCount = count ?? 0;
        const remaining = Math.max(0, PAID_ONBOARDING_LIMIT - totalCount);
        return {
          remaining,
          limit: PAID_ONBOARDING_LIMIT,
          isTrial: false,
          isOnboardingQuota: true,
        };
      } catch (err) {
        console.error('[useOnboardingQuota] Error:', err);
        return {
          remaining: PAID_ONBOARDING_LIMIT,
          limit: PAID_ONBOARDING_LIMIT,
          isTrial: false,
          isOnboardingQuota: true,
        };
      }
    },
  });

  return {
    isOnboarding,
    quotaInfo: query.data ?? (isOnboarding ? { remaining: PAID_ONBOARDING_LIMIT, limit: PAID_ONBOARDING_LIMIT, isTrial: false, isOnboardingQuota: true } : null),
    isLoading: query.isLoading,
  };
}
