import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface StoreGateProps {
  children: React.ReactNode;
}

export const StoreGate = ({ children }: StoreGateProps) => {
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        toast.error("Silakan login untuk mengakses Toko");
      } else if (!isAdmin && user.email !== 'jagofeed@gmail.com') {
        toast.error("Fitur Toko sedang dalam tahap Beta dan sementara dibatasi.");
      }
    }
  }, [user, isAdmin, isLoading]);

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

  if (!isAdmin && user.email !== 'jagofeed@gmail.com') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
