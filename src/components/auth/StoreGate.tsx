import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { WorkspaceUpsellDialog } from '../modul/WorkspaceUpsellDialog';

interface StoreGateProps {
  children: React.ReactNode;
}

export const StoreGate = ({ children }: StoreGateProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: subStatus, isLoading: subLoading } = useSubscriptionStatus();
  const [showUpsell, setShowUpsell] = useState(false);
  const navigate = useNavigate();

  const isLoading = authLoading || subLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        toast.error("Silakan login untuk mengakses fitur ini");
      } else if (!subStatus?.isPro) {
        setShowUpsell(true);
      }
    }
  }, [user, isLoading, subStatus?.isPro]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!subStatus?.isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <WorkspaceUpsellDialog 
          open={showUpsell} 
          onOpenChange={(open) => {
            setShowUpsell(open);
            if (!open) navigate('/app');
          }} 
        />
      </div>
    );
  }

  return <>{children}</>;
};
