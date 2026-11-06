import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export const TRIAL_CONTENT_LIMIT = 50;
export const TRIAL_DAILY_CONTENT_LIMIT = TRIAL_CONTENT_LIMIT; // Alias untuk kompatibilitas ke belakang

export interface TrialQuotaInfo {
  remaining: number;
  limit: number;
  isTrial: boolean;
}

export const useTrialQuota = () => {
  const { user } = useAuth();
  const { data: subStatus } = useSubscriptionStatus();
  const queryClient = useQueryClient();

  const isTrial = subStatus?.isTrial ?? false;

  const query = useQuery<TrialQuotaInfo | null>({
    queryKey: ['trial-quota', user?.id],
    enabled: !!user?.id && isTrial,
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('generation_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .neq('content_type', 'image');

        if (error) {
          console.warn('[useTrialQuota] Failed to count generation logs:', error);
          return {
            remaining: TRIAL_CONTENT_LIMIT,
            limit: TRIAL_CONTENT_LIMIT,
            isTrial: true,
          };
        }

        const totalCount = count ?? 0;
        const remaining = Math.max(0, TRIAL_CONTENT_LIMIT - totalCount);

        return {
          remaining,
          limit: TRIAL_CONTENT_LIMIT,
          isTrial: true,
        };
      } catch (err) {
        console.error('[useTrialQuota] Error:', err);
        return {
          remaining: TRIAL_CONTENT_LIMIT,
          limit: TRIAL_CONTENT_LIMIT,
          isTrial: true,
        };
      }
    },
  });

  const updateQuota = (info: Partial<TrialQuotaInfo>) => {
    if (!user?.id) return;
    queryClient.setQueryData<TrialQuotaInfo | null>(['trial-quota', user.id], (prev) => {
      const effectiveLimit = info.limit ?? prev?.limit ?? TRIAL_CONTENT_LIMIT;
      const normalizedLimit = effectiveLimit === 100 ? 50 : effectiveLimit;
      const effectiveRemaining = info.remaining ?? prev?.remaining ?? normalizedLimit;
      return {
        remaining: Math.min(effectiveRemaining, normalizedLimit),
        limit: normalizedLimit,
        isTrial: info.isTrial ?? prev?.isTrial ?? true,
      };
    });
  };

  const invalidateQuota = () => {
    queryClient.invalidateQueries({ queryKey: ['trial-quota'] });
  };

  return {
    quotaInfo: query.data ?? null,
    isLoading: query.isLoading,
    isTrial,
    updateQuota,
    invalidateQuota,
  };
};

