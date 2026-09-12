import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, Package, Ticket, ArrowLeft, LayoutDashboard, Menu, X } from 'lucide-react';
import StoreDashboardTab from '@/components/store/StoreDashboardTab';
import StoreProfileTab from '@/components/store/StoreProfileTab';
import StoreListingsTab from '@/components/store/StoreListingsTab';
import StoreOrdersTab from '@/components/store/StoreOrdersTab';
import StoreCouponsTab from '@/components/store/StoreCouponsTab';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    // Fitur toko sekarang terbuka untuk publik
  }, [user, isAdmin, isLoading, navigate]);

  // Tutup drawer ketika tab berubah
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [activeTab]);

  if (isLoading) {
    return null;
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
      </div>
      <div className={`store-nav-item ${activeTab === 'coupons' ? 'active' : ''} cursor-pointer`} onClick={() => setActiveTab('coupons')}>
        <Ticket className="w-5 h-5" />
        <span>Kupon Diskon</span>
      </div>
    </>
  );

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
          <div className="max-w-5xl mx-auto w-full">
            {activeTab === 'dashboard' && <StoreDashboardTab />}
            {activeTab === 'profile' && <StoreProfileTab />}
            {activeTab === 'listings' && <StoreListingsTab />}
            {activeTab === 'orders' && <StoreOrdersTab />}
            {activeTab === 'coupons' && <StoreCouponsTab />}
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
        <button className={`bn-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard />
          Beranda
        </button>
        <button className={`bn-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
          <ShoppingBag />
          Katalog
        </button>
        <button className={`bn-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <Package />
          Pesanan
        </button>
        <button className={`bn-item ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
          <Ticket />
          Kupon
        </button>
        <button className={`bn-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <Store />
          Profil
        </button>
      </nav>

    </div>
  );
};

export default StoreManagement;
