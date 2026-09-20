import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isSchoolFeatureAccessible } from '@/lib/feature-flags';
import { Loader2 } from 'lucide-react';

interface SchoolPilotRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard untuk Mode Sekolah pada tahap Deploy Terbatas.
 * Sesuai aturan di AGENTS.md, hanya Admin dan jagofeed@gmail.com yang dapat mengakses.
 * User lain yang mencoba mengakses URL /sekolah/* akan dialihkan langsung ke /app.
 */
export const SchoolPilotRoute: React.FC<SchoolPilotRouteProps> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isAllowed = isSchoolFeatureAccessible(user?.email, isAdmin);
  if (!isAllowed) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
