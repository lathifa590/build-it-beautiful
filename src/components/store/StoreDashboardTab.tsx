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
            className="flex items-center gap-2 px-4 py-2 bg-[#c04a1a] text-white font-bold rounded-lg hover:bg-[#a03d15] transition-colors shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] border-2 border-[#111] text-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Modul Baru
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card hover:-translate-y-1 transition-transform">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-1">Kunjungan Toko</p>
              <h3 className="text-2xl font-black text-[#111]">{views}</h3>
            </div>
            <div className="p-2 bg-[#e8e0d0] rounded-lg border-2 border-[#111]">
              <Users className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+0% dari minggu lalu</span>
            </p>
          </div>
        </div>

        <div className="card hover:-translate-y-1 transition-transform">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-1">Dilihat Modul</p>
              <h3 className="text-2xl font-black text-[#111]">{clicks}</h3>
            </div>
            <div className="p-2 bg-[#e8e0d0] rounded-lg border-2 border-[#111]">
              <Eye className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+0% dari minggu lalu</span>
            </p>
          </div>
        </div>

        <div className="card hover:-translate-y-1 transition-transform">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-1">Penjualan Selesai</p>
              <h3 className="text-2xl font-black text-[#111]">{sales}</h3>
            </div>
            <div className="p-2 bg-[#e8e0d0] rounded-lg border-2 border-[#111]">
              <ShoppingBag className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Belum ada penjualan
            </p>
          </div>
        </div>

        <div className="card hover:-translate-y-1 transition-transform">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-1">Total Pendapatan</p>
              <h3 className="text-2xl font-black text-[#111]">Rp{revenue.toLocaleString('id-ID')}</h3>
            </div>
            <div className="p-2 bg-[#e8e0d0] rounded-lg border-2 border-[#111]">
              <DollarSign className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Belum ada pendapatan
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="card lg:col-span-2">
          <div className="card-head">
            <h3 className="font-black text-[#111] text-base">Grafik Kunjungan (7 Hari Terakhir)</h3>
          </div>
          <div className="p-4 h-[300px] w-full">
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
        <div className="card flex flex-col">
          <div className="card-head flex items-center justify-between border-b-2 border-[#111] pb-3 mb-0">
            <h3 className="font-black text-[#111] text-base">Modul Terpopuler</h3>
            <button className="text-xs font-bold text-[#c04a1a] hover:underline flex items-center gap-1">
              Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 flex-1 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
            <div className="w-16 h-16 bg-[#e8e0d0] rounded-full flex items-center justify-center border-2 border-[#111]">
              <Package className="w-8 h-8 text-[#111]" />
            </div>
            <div>
              <p className="font-bold text-[#111]">Belum ada data</p>
              <p className="text-sm text-muted-foreground font-medium mt-1">Publikasikan modul ajar Anda ke toko untuk melihat statistiknya.</p>
            </div>
            <button 
              onClick={() => navigate('/app')}
              className="mt-2 px-4 py-2 bg-white border-2 border-[#111] rounded-lg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] transition-all"
            >
              Ke Katalog Saya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDashboardTab;
