import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useGeminiKeys() {
  const { user } = useAuth();

  const query = useQuery<string[]>({
    queryKey: ['user-gemini-keys', user?.id],
    enabled: !!user?.id,
    staleTime: 10_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      return (data ?? []).map((r: { api_key: string }) => r.api_key).filter(Boolean);
    },
  });

  const apiKeys = query.data ?? [];
  return {
    apiKeys,
    loading: query.isLoading,
    hasActiveKey: apiKeys.length > 0,
  };
}
