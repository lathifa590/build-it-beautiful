import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { Loader2 } from 'lucide-react';

interface SchoolPilotRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard untuk Mode Sekolah.
 * Mengizinkan akses untuk:
 * 1. Admin platform.
 * 2. Akun pilot Deploy Terbatas (jagofeed@gmail.com).
 * 3. Anggota sekolah dengan langganan aktif (subscription_expires_at > now()).
 * User lain dialihkan ke /app.
 */
export const SchoolPilotRoute: React.FC<SchoolPilotRouteProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isFeatureAllowed, isLoading: schoolLoading } = useSchool();

  if (authLoading || schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Memeriksa akses Mode Sekolah...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isFeatureAllowed) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

