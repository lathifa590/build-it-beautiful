import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import {
  Users,
  UserPlus,
  FileText,
  Activity,
  Sparkles,
  TrendingUp,
  School,
  Building2,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  useDashboardAnalytics,
  TimeRangeOption,
} from '@/components/admin/dashboard/useDashboardAnalytics';
import { DashboardFilter } from '@/components/admin/dashboard/DashboardFilter';
import { UserGrowthChart } from '@/components/admin/dashboard/UserGrowthChart';
import { UserSegmentationCard } from '@/components/admin/dashboard/UserSegmentationCard';
import { ExpiringSubscriptionsCard } from '@/components/admin/dashboard/ExpiringSubscriptionsCard';
import { RecentUsersCard } from '@/components/admin/dashboard/RecentUsersCard';
import { format, subDays } from 'date-fns';

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const {
    isLoading,
    isRefreshing,
    dateBounds,
    metrics,
    chartData,
    expiringCustomers,
    recentUsers,
    refetch,
    exportToCSV,
  } = useDashboardAnalytics(timeRange, customStartDate, customEndDate);

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Zap className="w-7 h-7 text-primary fill-primary/20" /> Dashboard Administrasi
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Pantau tren pertumbuhan pengguna, performa sistem, dan aktivitas modul ajar
            </p>
          </div>
        </div>

        {/* Global Filter & Actions */}
        <DashboardFilter
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          onRefresh={refetch}
          onExport={exportToCSV}
          isRefreshing={isRefreshing}
          activeLabel={dateBounds.label}
        />

        {/* Stats Grid - 6 KPI cards with responsive columns & trend metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <StatCard
            title="Total Pengguna"
            value={isLoading ? '...' : metrics.totalUsers.toLocaleString('id-ID')}
            icon={Users}
            description="Semua waktu"
            color="primary"
          />

          <StatCard
            title="Pengguna Baru"
            value={isLoading ? '...' : metrics.periodNewUsers.toLocaleString('id-ID')}
            icon={UserPlus}
            description={`Periode: ${dateBounds.label}`}
            trend={
              timeRange !== 'all'
                ? {
                    value: metrics.userGrowthTrend.value,
                    isPositive: metrics.userGrowthTrend.isPositive,
                    label: metrics.userGrowthTrend.label,
                  }
                : undefined
            }
            color="success"
          />

          <StatCard
            title="Rata-rata Pendaftaran"
            value={isLoading ? '...' : `${metrics.dailyAverageNewUsers}`}
            icon={TrendingUp}
            description="Pengguna per hari"
            color="info"
          />

          <StatCard
            title="Aktivasi Profil"
            value={isLoading ? '...' : `${metrics.activationRate}%`}
            icon={FileText}
            description={`${metrics.totalTeacherProfiles} profil guru`}
            color="primary"
          />

          <StatCard
            title="Total Konten"
            value={isLoading ? '...' : metrics.totalGenerationsAllTime.toLocaleString('id-ID')}
            icon={Sparkles}
            description="Semua modul dibuat"
            color="warning"
          />

          <StatCard
            title="Konten Periode Ini"
            value={isLoading ? '...' : metrics.periodGenerations.toLocaleString('id-ID')}
            icon={Activity}
            description="Generasi dibuat"
            trend={
              timeRange !== 'all'
                ? {
                    value: metrics.generationGrowthTrend.value,
                    isPositive: metrics.generationGrowthTrend.isPositive,
                    label: metrics.generationGrowthTrend.label,
                  }
                : undefined
            }
            color="success"
          />
        </div>

        {/* Row 2: Analytics & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main User Growth Chart (Takes 2 Columns on desktop) */}
          <div className="lg:col-span-2">
            <UserGrowthChart
              growthSeries={chartData.growthSeries}
              dayOfWeekDistribution={chartData.dayOfWeekDistribution}
              peakRegistration={chartData.peakRegistration}
              dailyAverageNewUsers={metrics.dailyAverageNewUsers}
              periodNewUsers={metrics.periodNewUsers}
              activeLabel={dateBounds.label}
            />
          </div>

          {/* User Segmentation & Funnel (Takes 1 Column on desktop) */}
          <div className="lg:col-span-1">
            <UserSegmentationCard
              allowedStats={metrics.allowedCustomerStats}
              totalUsers={metrics.totalUsers}
              totalTeacherProfiles={metrics.totalTeacherProfiles}
              activationRate={metrics.activationRate}
            />
          </div>
        </div>

        {/* Row 3: Actionable Cards (Recent Users & Subscriptions Watchlist) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentUsersCard users={recentUsers} />
          <ExpiringSubscriptionsCard customers={expiringCustomers} />
        </div>

        {/* Row 4: Quick Navigation / Aksi Cepat */}
        <div className="bg-card border-2 border-foreground rounded-xl p-4 md:p-6 shadow-brutal">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-extrabold text-foreground">
              Aksi Cepat & Navigasi Modul
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">Pintasan Cepat</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <a
              href="/admin/users"
              className="p-3 md:p-4 bg-secondary border-2 border-foreground/30 rounded-lg hover:border-foreground hover:shadow-brutal-sm transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/30 group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="w-5 h-5 text-primary group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm md:text-base text-foreground">Kelola Pengguna</p>
                <p className="text-xs text-muted-foreground truncate">Lihat data & reset akses</p>
              </div>
            </a>

            <a
              href="/admin/customers"
              className="p-3 md:p-4 bg-secondary border-2 border-foreground/30 rounded-lg hover:border-foreground hover:shadow-brutal-sm transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-info/10 rounded-lg border border-info/30 group-hover:bg-info group-hover:text-white transition-colors">
                <FileText className="w-5 h-5 text-info group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm md:text-base text-foreground">Pelanggan Lama</p>
                <p className="text-xs text-muted-foreground truncate">Whitelist & perpanjangan</p>
              </div>
            </a>

            <a
              href="/admin/schools"
              className="p-3 md:p-4 bg-secondary border-2 border-foreground/30 rounded-lg hover:border-foreground hover:shadow-brutal-sm transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <School className="w-5 h-5 text-emerald-700 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm md:text-base text-foreground">Sekolah & B2B</p>
                <p className="text-xs text-muted-foreground truncate">Supervisi & paket sekolah</p>
              </div>
            </a>

            <a
              href="/admin/settings"
              className="p-3 md:p-4 bg-secondary border-2 border-foreground/30 rounded-lg hover:border-foreground hover:shadow-brutal-sm transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/30 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Settings className="w-5 h-5 text-purple-700 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm md:text-base text-foreground">Pengaturan</p>
                <p className="text-xs text-muted-foreground truncate">Konfigurasi API & sistem</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
