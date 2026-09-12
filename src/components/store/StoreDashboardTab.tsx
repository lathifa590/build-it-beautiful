import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { useQuery } from '@tanstack/react-query';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Eye, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Dummy data for charts
const revenueData = [
  { name: 'Sen', total: 0 },
  { name: 'Sel', total: 0 },
  { name: 'Rab', total: 0 },
  { name: 'Kam', total: 0 },
  { name: 'Jum', total: 0 },
  { name: 'Sab', total: 0 },
  { name: 'Min', total: 0 },
];

const StoreDashboardTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
      </div>
    );
  }

  const views = profile?.metrics?.views || 0;
  const clicks = profile?.metrics?.clicks || 0;
  // Placeholder for sales and revenue since we might not have actual transactions tracked yet
  const sales = 0; 
  const revenue = 0;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111]">Dashboard Toko</h2>
          <p className="text-muted-foreground font-medium text-sm">Pantau performa toko dan penjualan Anda.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/app')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Buat Modul Baru
          </button>
        </div>
      </div>

      {/* Main Stats (Desktop/Tablet ≥ 640px) */}
      <div className="stat-grid-store hidden sm:grid">
        <div className="stat-card-store">
          <div className="stat-card-store__header">
            <div>
              <p className="stat-card-store__label">Kunjungan Toko</p>
              <h3 className="stat-card-store__value">{views}</h3>
            </div>
            <div className="stat-card-store__icon">
              <Users className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="stat-card-store__delta flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+0% dari minggu lalu</span>
            </p>
          </div>
        </div>

        <div className="stat-card-store">
          <div className="stat-card-store__header">
            <div>
              <p className="stat-card-store__label">Dilihat Modul</p>
              <h3 className="stat-card-store__value">{clicks}</h3>
            </div>
            <div className="stat-card-store__icon">
              <Eye className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="stat-card-store__delta flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+0% dari minggu lalu</span>
            </p>
          </div>
        </div>

        <div className="stat-card-store">
          <div className="stat-card-store__header">
            <div>
              <p className="stat-card-store__label">Penjualan Selesai</p>
              <h3 className="stat-card-store__value">{sales}</h3>
            </div>
            <div className="stat-card-store__icon">
              <ShoppingBag className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="stat-card-store__sub">
              Belum ada penjualan
            </p>
          </div>
        </div>

        <div className="stat-card-store stat-card-store--income">
          <div className="stat-card-store__header">
            <div>
              <p className="stat-card-store__label">Total Pendapatan</p>
              <h3 className="stat-card-store__value">Rp{revenue.toLocaleString('id-ID')}</h3>
            </div>
            <div className="stat-card-store__icon">
              <DollarSign className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="stat-card-store__sub">
              Belum ada pendapatan
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats (Mobile) */}
      <div className="stat-strip sm:hidden">
        <div className="stat-chip">
          <span className="stat-chip-label">Kunjungan</span>
          <div className="stat-chip-val">{views}</div>
          <div className="stat-chip-sub">↑ +0% minggu ini</div>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Dilihat</span>
          <div className="stat-chip-val">{clicks}</div>
          <div className="stat-chip-sub">↑ +0% minggu ini</div>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Terjual</span>
          <div className="stat-chip-val">{sales}</div>
          <div className="stat-chip-sub text-muted-foreground">transaksi</div>
        </div>
        <div className="stat-chip stat-chip--income">
          <span className="stat-chip-label">Pendapatan</span>
          <div className="stat-chip-val">Rp{revenue.toLocaleString('id-ID')}</div>
          <div className="stat-chip-sub text-muted-foreground">bulan ini</div>
        </div>
      </div>

      <div className="dashboard-bottom">
        {/* Chart Section */}
        <div className="chart-card">
          <div className="chart-card__head">
            Grafik Kunjungan (7 Hari Terakhir)
          </div>
          <div className="chart-card__body h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c04a1a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#c04a1a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '2px solid #111',
                    boxShadow: '4px 4px 0px 0px rgba(17,17,17,1)',
                    fontWeight: 'bold'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#c04a1a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders or Popular Modules */}
        <div className="chart-card flex flex-col">
          <div className="chart-card__head flex items-center justify-between border-b-2 border-[#111]">
            <span>Modul Terpopuler</span>
            <button className="text-xs font-bold text-[#c04a1a] hover:underline flex items-center gap-1">
              Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="chart-card__body flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
              <div className="w-16 h-16 bg-[#e8e0d0] rounded-lg flex items-center justify-center border-2 border-[#111]">
                <Package className="w-8 h-8 text-[#111]" />
              </div>
              <div>
                <p className="font-bold text-[#111]">Belum ada data</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Publikasikan modul ajar Anda ke toko untuk melihat statistiknya.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="mob-cta sm:hidden mt-6">
        <button 
          className="btn btn-primary w-full justify-center"
          onClick={() => navigate('/app')}
        >
          <Plus className="w-5 h-5 mr-1" />
          Tambah Modul Baru
        </button>
      </div>
    </div>
  );
};

export default StoreDashboardTab;
