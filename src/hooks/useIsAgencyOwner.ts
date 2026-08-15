import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useIsAgencyOwner = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['is-agency-owner', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_owners')
        .select('id, is_active')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  return !!data && data.is_active === true;
};
