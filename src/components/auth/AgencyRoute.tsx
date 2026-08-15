import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AgencyRouteProps {
  children: React.ReactNode;
}

export const AgencyRoute = ({ children }: AgencyRouteProps) => {
  const { user, isLoading } = useAuth();

  const { data, isLoading: checkLoading } = useQuery({
    queryKey: ['is-agency-owner', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_owners')
        .select('id, is_active')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading || checkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!data || !data.is_active) return <Navigate to="/app" replace />;

  return <>{children}</>;
};
