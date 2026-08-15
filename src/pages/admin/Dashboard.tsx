import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Users, UserPlus, FileText, Activity, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalProfiles: 0,
    totalGenerations: 0,
    weeklyGenerations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Fetch all stats in parallel
        const [
          userCountResult,
          newUsersResult,
          profileCountResult,
          generationCountResult,
          weeklyGenerationsResult
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
          supabase.from('teacher_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('generation_logs').select('*', { count: 'exact', head: true }),
          supabase.from('generation_logs').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        ]);

        setStats({
          totalUsers: userCountResult.count || 0,
          newUsersThisWeek: newUsersResult.count || 0,
          totalProfiles: profileCountResult.count || 0,
          totalGenerations: generationCountResult.count || 0,
          weeklyGenerations: weeklyGenerationsResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Selamat datang di panel administrasi Perangkat Ajar
          </p>
        </div>

        {/* Stats Grid - 2 cols on mobile, 3 on tablet, 6 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <StatCard
            title="Total Pengguna"
            value={isLoading ? '...' : stats.totalUsers}
            icon={Users}
            description="Terdaftar"
            color="primary"
          />
          <StatCard
            title="Pengguna Baru"
            value={isLoading ? '...' : stats.newUsersThisWeek}
            icon={UserPlus}
            description="7 hari terakhir"
            color="success"
          />
          <StatCard
            title="Total Profil"
            value={isLoading ? '...' : stats.totalProfiles}
            icon={FileText}
            description="Profil guru"
            color="info"
          />
          <StatCard
            title="Total Konten"
            value={isLoading ? '...' : stats.totalGenerations}
            icon={Sparkles}
            description="Konten dibuat"
            color="primary"
          />
          <StatCard
            title="Konten Minggu Ini"
            value={isLoading ? '...' : stats.weeklyGenerations}
            icon={TrendingUp}
            description="7 hari terakhir"
            color="success"
          />
          <StatCard
            title="Status Sistem"
            value="Aktif"
            icon={Activity}
            description="Semua layanan"
            color="success"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-card border-2 border-foreground rounded-xl p-4 md:p-6 shadow-brutal">
          <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <a
              href="/admin/users"
              className="p-3 md:p-4 bg-secondary border-2 border-foreground/30 rounded-lg hover:border-foreground hover:shadow-brutal-sm transition-all flex items-center gap-3"
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm md:text-base">Kelola Pengguna</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Lihat dan edit pengguna</p>
              </div>
            </a>
            <a
              href="/admin/customers"
              className="p-3 md:p-4 bg-secondary border-2 border-foreground/30 rounded-lg hover:border-foreground hover:shadow-brutal-sm transition-all flex items-center gap-3"
            >
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-info flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm md:text-base">Pelanggan Lama</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Kelola whitelist</p>
              </div>
            </a>
            <a
              href="/admin/settings"
              className="p-3 md:p-4 bg-secondary border-2 border-foreground/30 rounded-lg hover:border-foreground hover:shadow-brutal-sm transition-all flex items-center gap-3"
            >
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm md:text-base">Pengaturan</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Konfigurasi sistem</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
