import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { useQuery } from '@tanstack/react-query';
import { StoreMetricRow } from '@/types/store';
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
  ShoppingBag,
  DollarSign,
  Package,
  Eye,
  ArrowRight,
  Plus,
  Users,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoreDashboardTabProps {
  onNavigate?: (tab: string) => void;
}

const formatRupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

const buildWeekChart = (metrics: StoreMetricRow[] | undefined) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const rows = metrics?.filter((m) => m.date === key) ?? [];
    return {
      name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      pesanan: rows.reduce((s, m) => s + (m.orders_completed || 0), 0),
      pendapatan: rows.reduce((s, m) => s + (m.revenue_amount || 0), 0),
    };
  });
};

const StoreDashboardTab = ({ onNavigate }: StoreDashboardTabProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['storeOrders', profile?.store_id],
    queryFn: () => storeApi.getMyStoreOrders(profile!.store_id),
    enabled: !!profile?.store_id,
  });

  const { data: metrics } = useQuery({
    queryKey: ['storeMetrics', profile?.store_id],
    queryFn: () => storeApi.getStoreMetrics(profile!.store_id),
    enabled: !!profile?.store_id,
  });

  const { data: listings } = useQuery({
    queryKey: ['storeListings', profile?.store_id],
    queryFn: () => storeApi.getStoreListings(profile!.store_id, false),
    enabled: !!profile?.store_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
      </div>
    );
  }

  // Statistik nyata dari data pesanan & metrik
  const completedOrders = orders?.filter((o) => o.status === 'SELESAI') ?? [];
  const pendingReviewCount = orders?.filter((o) => o.status === 'PENDING_REVIEW').length ?? 0;
  const sales = completedOrders.length;
  const revenue = completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const views = metrics?.reduce((s, m) => s + (m.store_views || 0), 0) ?? 0;
  const clicks = metrics?.reduce((s, m) => s + (m.product_views || 0), 0) ?? 0;

  const chartData = buildWeekChart(metrics);
  const hasAnyTraffic = views > 0 || clicks > 0;

  // Modul terpopuler: agregasi product_views per listing
  const viewsByListing = new Map<string, number>();
  metrics?.forEach((m) => {
    if (m.listing_id) {
      viewsByListing.set(m.listing_id, (viewsByListing.get(m.listing_id) || 0) + (m.product_views || 0));
    }
  });
  const topListings = Array.from(viewsByListing.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([listingId, v]) => ({
      listingId,
      title: listings?.find((l) => l.listing_id === listingId)?.title || 'Modul',
      views: v,
    }));

  const recentOrders = (orders ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111]">Dashboard Toko</h2>
          <p className="text-muted-foreground font-medium text-sm">
            Pantau performa toko dan penjualan Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate ? onNavigate('listings') : navigate('/app')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Tambah Modul Jualan
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
            <p className="stat-card-store__sub">
              {hasAnyTraffic ? 'Total kunjungan tercatat' : 'Belum ada kunjungan tercatat'}
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
            <p className="stat-card-store__sub">
              {hasAnyTraffic ? 'Total view semua produk' : 'Bagikan link toko Anda!'}
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
              {pendingReviewCount > 0
                ? `${pendingReviewCount} pesanan menunggu konfirmasi`
                : 'Tidak ada pesanan menunggu'}
            </p>
          </div>
        </div>

        <div className="stat-card-store stat-card-store--income">
          <div className="stat-card-store__header">
            <div>
              <p className="stat-card-store__label">Total Pendapatan</p>
              <h3 className="stat-card-store__value">{formatRupiah(revenue)}</h3>
            </div>
            <div className="stat-card-store__icon">
              <DollarSign className="w-5 h-5 text-[#111]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="stat-card-store__sub">
              {sales > 0 ? 'Dari pesanan selesai' : 'Belum ada pendapatan'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats (Mobile) */}
      <div className="stat-strip sm:hidden">
        <div className="stat-chip">
          <span className="stat-chip-label">Kunjungan</span>
          <div className="stat-chip-val">{views}</div>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Dilihat</span>
          <div className="stat-chip-val">{clicks}</div>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Terjual</span>
          <div className="stat-chip-val">{sales}</div>
          <div className="stat-chip-sub text-muted-foreground">
            {pendingReviewCount > 0 ? `${pendingReviewCount} review` : 'transaksi'}
          </div>
        </div>
        <div className="stat-chip stat-chip--income">
          <span className="stat-chip-label">Pendapatan</span>
          <div className="stat-chip-val">{formatRupiah(revenue)}</div>
        </div>
      </div>

      <div className="dashboard-bottom">
        {/* Chart Section */}
        <div className="chart-card">
          <div className="chart-card__head">
            Pendapatan (7 Hari Terakhir)
          </div>
          <div className="chart-card__body h-[300px]">
            {hasAnyTraffic || sales > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v))}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '2px solid #111',
                      boxShadow: '4px 4px 0px 0px rgba(17,17,17,1)',
                      fontWeight: 'bold'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pendapatan"
                    stroke="#c04a1a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 bg-[#e8e0d0] rounded-lg flex items-center justify-center border-2 border-[#111]">
                  <ArrowRight className="w-6 h-6 text-[#111]" />
                </div>
                <p className="font-bold text-[#111]">Belum ada aktivitas</p>
                <p className="text-sm text-muted-foreground font-medium max-w-xs">
                  Grafik akan terisi otomatis begitu toko Anda dikunjungi atau ada pesanan masuk.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modul Terpopuler + Pesanan Terbaru */}
        <div className="chart-card flex flex-col">
          <div className="chart-card__head flex items-center justify-between border-b-2 border-[#111]">
            <span>Modul Terpopuler</span>
            <button
              className="text-xs font-bold text-[#c04a1a] hover:underline flex items-center gap-1"
              onClick={() => onNavigate && onNavigate('listings')}
            >
              Kelola <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="chart-card__body flex-1 flex flex-col">
            {topListings.length > 0 ? (
              <ul className="divide-y divide-[#e5e7eb]">
                {topListings.map((l, i) => (
                  <li key={l.listingId} className="flex items-center gap-3 py-3">
                    <span className="w-6 h-6 shrink-0 flex items-center justify-center bg-[#e8e0d0] border-2 border-[#111] rounded text-xs font-black text-[#111]">
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0 truncate font-bold text-sm text-[#111]">{l.title}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
                      <Eye className="w-3 h-3" /> {l.views}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                <div className="w-16 h-16 bg-[#e8e0d0] rounded-lg flex items-center justify-center border-2 border-[#111]">
                  <Package className="w-8 h-8 text-[#111]" />
                </div>
                <div>
                  <p className="font-bold text-[#111]">Belum ada data</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    Publikasikan modul ajar Anda ke toko untuk melihat statistiknya.
                  </p>
                </div>
                {listings && listings.length > 0 && onNavigate && (
                  <button
                    className="text-xs font-bold text-[#c04a1a] hover:underline"
                    onClick={() => onNavigate('listings')}
                  >
                    Kelola katalog Anda
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pesanan terbaru */}
          {recentOrders.length > 0 && (
            <>
              <div className="chart-card__head flex items-center justify-between border-t-2 border-b-2 border-[#111]">
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Pesanan Terbaru
                </span>
                <button
                  className="text-xs font-bold text-[#c04a1a] hover:underline flex items-center gap-1"
                  onClick={() => onNavigate && onNavigate('orders')}
                >
                  Semua <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <ul className="divide-y divide-[#e5e7eb]">
                {recentOrders.map((o) => (
                  <li key={o.order_id} className="flex items-center justify-between gap-2 py-2.5 px-1">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#111] truncate">{o.listing?.title || 'Modul'}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {o.invoice_number} · {o.buyer_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-[#111]">
                        {o.total_amount === 0 ? 'Gratis' : formatRupiah(o.total_amount)}
                      </p>
                      <p className={`text-[10px] font-black uppercase ${
                        o.status === 'SELESAI' ? 'text-green-700' :
                        o.status === 'PENDING_REVIEW' ? 'text-blue-700' : 'text-amber-700'
                      }`}>
                        {o.status === 'SELESAI' ? 'Selesai' : o.status === 'PENDING_REVIEW' ? 'Review' : 'Belum Bayar'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="mob-cta sm:hidden mt-6">
        <button
          className="btn btn-primary w-full justify-center"
          onClick={() => onNavigate ? onNavigate('listings') : navigate('/app')}
        >
          <Plus className="w-5 h-5 mr-1" />
          Tambah Modul Baru
        </button>
      </div>
    </div>
  );
};

export default StoreDashboardTab;
