import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Store, ShoppingBag, Package, Ticket, ArrowLeft, LayoutDashboard, Menu, X, Sparkles, Rocket, ClipboardList } from 'lucide-react';
import StoreDashboardTab from '@/components/store/StoreDashboardTab';
import StoreProfileTab from '@/components/store/StoreProfileTab';
import StoreListingsTab from '@/components/store/StoreListingsTab';
import StoreOrdersTab from '@/components/store/StoreOrdersTab';
import StoreCouponsTab from '@/components/store/StoreCouponsTab';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';

const TAB_LABELS: Record<string, string> = {
  dashboard: '🏪 Dashboard Toko',
  profile: '🏷️ Profil & Identitas',
  listings: '📦 Katalog Modul',
  orders: '📋 Pesanan Masuk',
  coupons: '🏷️ Kupon Diskon',
};

const StoreManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['storeOrders', profile?.store_id],
    queryFn: () => storeApi.getMyStoreOrders(profile!.store_id),
    enabled: !!profile?.store_id,
  });

  const pendingReviewCount = orders?.filter((o) => o.status === 'PENDING_REVIEW').length ?? 0;
  const needsOnboarding = !profileLoading && !profile;

  // Pengguna tanpa toko diarahkan ke tab profil untuk onboarding
  useEffect(() => {
    if (needsOnboarding && activeTab !== 'profile') {
      setActiveTab('profile');
    }
  }, [needsOnboarding, activeTab]);

  // Tutup drawer ketika tab berubah
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [activeTab]);

  if (isLoading || profileLoading) {
    return (
      <div className="bg-[#f5f0e8] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
      </div>
    );
  }

  const renderSidebarNavItems = () => (
    <>
      <div className={`store-nav-item ${activeTab === 'dashboard' ? 'active' : ''} cursor-pointer`} onClick={() => setActiveTab('dashboard')}>
        <LayoutDashboard className="w-5 h-5" />
        <span>Beranda</span>
      </div>
      <div className={`store-nav-item ${activeTab === 'profile' ? 'active' : ''} cursor-pointer`} onClick={() => setActiveTab('profile')}>
        <Store className="w-5 h-5" />
        <span>Profil & Identitas</span>
      </div>
      <div className={`store-nav-item ${activeTab === 'listings' ? 'active' : ''} cursor-pointer`} onClick={() => setActiveTab('listings')}>
        <ShoppingBag className="w-5 h-5" />
        <span>Katalog Modul Ajar</span>
      </div>
      <div className={`store-nav-item ${activeTab === 'orders' ? 'active' : ''} cursor-pointer`} onClick={() => setActiveTab('orders')}>
        <Package className="w-5 h-5" />
        <span>Pesanan Masuk</span>
        {pendingReviewCount > 0 && (
          <span className="ml-auto min-w-[20px] h-5 px-1 flex items-center justify-center bg-[#c04a1a] text-white text-[10px] font-black rounded-full border-2 border-[#111]">
            {pendingReviewCount}
          </span>
        )}
      </div>
      <div className={`store-nav-item ${activeTab === 'coupons' ? 'active' : ''} cursor-pointer`} onClick={() => setActiveTab('coupons')}>
        <Ticket className="w-5 h-5" />
        <span>Kupon Diskon</span>
      </div>
    </>
  );

  // Panel onboarding untuk pengguna yang belum punya toko
  const renderOnboarding = () => (
    <div className="card mt-6">
      <div className="card-body p-8 md:p-12 flex flex-col items-center text-center space-y-5">
        <div className="w-20 h-20 bg-[#e8e0d0] border-2 border-[#111] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
          <Rocket className="w-10 h-10 text-[#c04a1a]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#111]">Buka Toko Modul Ajar Anda! 🎉</h2>
          <p className="text-sm font-semibold text-muted-foreground max-w-md">
            Satu langkah terakhir: lengkapi nama toko, rekening pencairan, dan nomor WhatsApp Anda.
            Setelah disimpan, toko Anda langsung punya alamat publik sendiri.
          </p>
        </div>
        <ol className="text-left space-y-2 w-full max-w-sm text-sm font-semibold text-[#111]">
          <li className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c04a1a] shrink-0" /> Isi nama & alamat (slug) toko
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c04a1a] shrink-0" /> Masukkan rekening & WhatsApp pencairan
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c04a1a] shrink-0" /> Simpan, lalu unggah modul pertama Anda
          </li>
        </ol>
        <button
          className="btn-primary w-full sm:w-auto"
          onClick={() => setActiveTab('profile')}
        >
          <Store className="w-4 h-4 mr-2 inline" />
          Lengkapi Profil Toko Sekarang
        </button>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    // Selama toko belum ada, selain tab profil tampilkan onboarding
    if (needsOnboarding && activeTab !== 'profile') {
      return renderOnboarding();
    }
    return (
      <>
        {activeTab === 'dashboard' && <StoreDashboardTab onNavigate={setActiveTab} />}
        {activeTab === 'profile' && <StoreProfileTab />}
        {activeTab === 'listings' && <StoreListingsTab />}
        {activeTab === 'orders' && <StoreOrdersTab />}
        {activeTab === 'coupons' && <StoreCouponsTab />}
      </>
    );
  };

  const bottomNavItems = [
    { key: 'dashboard', label: 'Beranda', icon: <LayoutDashboard /> },
    { key: 'listings', label: 'Katalog', icon: <ShoppingBag /> },
    { key: 'orders', label: 'Pesanan', icon: <Package /> },
    { key: 'coupons', label: 'Kupon', icon: <Ticket /> },
    { key: 'profile', label: 'Profil', icon: <Store /> },
  ];

  return (
    <div className="bg-[#f5f0e8] min-h-screen">

      {/* ══ MOBILE/TABLET TOPBAR ══ */}
      <div className="store-topbar">
        <div className="flex items-center gap-2">
          {/* Hamburger — hanya tablet (md+), di mobile tidak perlu */}
          <button
            className="hidden md:flex p-1 rounded-md text-[#111] hover:bg-gray-100"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <Store className="w-5 h-5 text-[#111]" />
          <span className="store-topbar-title">{TAB_LABELS[activeTab]}</span>
        </div>
      </div>

      {/* ══ MAIN LAYOUT: sidebar + konten ══ */}
      <div className="flex min-h-screen">

        {/* --- DESKTOP SIDEBAR --- */}
        <div className="store-sidebar">
          <div className="store-sidebar__brand">
            <Store className="w-6 h-6 text-[#111]" />
            <span>Toko Saya</span>
          </div>

          <div className="flex-1 space-y-1">
            {renderSidebarNavItems()}
          </div>

          <button onClick={() => navigate('/app')} className="store-back-btn">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>

        {/* --- KONTEN UTAMA --- */}
        <div className="layout-content flex-1 min-w-0">
          <div className="max-w-5xl mx-auto w-full pb-24 md:pb-8">
            {renderActiveTab()}
          </div>
        </div>
      </div>

      {/* ══ TABLET DRAWER ══ */}
      <div className={`store-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="store-drawer__overlay" onClick={() => setIsDrawerOpen(false)}></div>
        <div className="store-drawer__panel">
          <div className="store-sidebar__brand mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-[#111]" />
              <span>Toko Saya</span>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-[#111]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {renderSidebarNavItems()}
          </div>
          <button onClick={() => navigate('/app')} className="store-back-btn mt-auto">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="bottom-nav">
        {bottomNavItems.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`bn-item relative ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {icon}
            {label}
            {key === 'orders' && pendingReviewCount > 0 && (
              <span className="absolute top-0.5 right-2 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[#c04a1a] text-white text-[9px] font-black rounded-full">
                {pendingReviewCount}
              </span>
            )}
          </button>
        ))}
      </nav>

    </div>
  );
};

export default StoreManagement;
