import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, Package, Ticket, ArrowLeft } from 'lucide-react';
import StoreProfileTab from '@/components/store/StoreProfileTab';
import StoreListingsTab from '@/components/store/StoreListingsTab';
import StoreOrdersTab from '@/components/store/StoreOrdersTab';
import StoreCouponsTab from '@/components/store/StoreCouponsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const StoreManagement = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin && user?.email !== 'jagofeed@gmail.com') {
      navigate('/app', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || (!isAdmin && user?.email !== 'jagofeed@gmail.com')) {
    return null;
  }

  return (
    <div className="bg-[#f5f0e8] min-h-screen md:flex">
      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden md:flex sidebar w-64 flex-col justify-between h-screen sticky top-0 border-r-2 border-[#111] bg-[#f5f0e8] z-10 p-6">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <Store className="w-6 h-6 text-[#111]" />
            <h1 className="text-xl font-black text-[#111]">Toko Saya</h1>
          </div>

          <div className="space-y-2">
            <div 
              className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Store className="w-4 h-4" />
              <span>Profil & Identitas</span>
            </div>
            
            <div 
              className={`sidebar-item ${activeTab === 'listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('listings')}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Katalog Modul Ajar</span>
            </div>
            
            <div 
              className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package className="w-4 h-4" />
              <span>Pesanan Masuk</span>
            </div>
            
            <div 
              className={`sidebar-item ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              <Ticket className="w-4 h-4" />
              <span>Kupon Diskon</span>
            </div>
          </div>
        </div>

        {/* Footer Sidebar - Tombol Kembali */}
        <div className="mt-8 pt-6 border-t-2 border-[#111]">
          <button 
            onClick={() => navigate('/app')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-[#111] border-2 border-[#111] rounded-lg hover:bg-[#e8e0d0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden sticky top-0 z-20 bg-[#f5f0e8] border-b-2 border-[#111] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#111]" />
          <h1 className="text-lg font-black text-[#111]">Toko Saya</h1>
        </div>
        <button 
          onClick={() => navigate('/app')}
          className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-bold text-[#111] border-2 border-[#111] rounded-lg hover:bg-[#e8e0d0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
      </div>

      {/* --- KONTEN UTAMA --- */}
      <div className="flex-1 p-4 pb-28 md:pb-8 md:p-8 md:h-screen overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'profile' && <StoreProfileTab />}
          {activeTab === 'listings' && <StoreListingsTab />}
          {activeTab === 'orders' && <StoreOrdersTab />}
          {activeTab === 'coupons' && <StoreCouponsTab />}
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#f5f0e8] border-t-2 border-[#111] flex items-center justify-around p-2 pb-safe shadow-lg">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-full p-2 rounded-lg ${activeTab === 'profile' ? 'text-[#c04a1a] font-bold' : 'text-gray-500'}`}
        >
          <Store className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Profil</span>
        </button>
        <button 
          onClick={() => setActiveTab('listings')}
          className={`flex flex-col items-center justify-center w-full p-2 rounded-lg ${activeTab === 'listings' ? 'text-[#c04a1a] font-bold' : 'text-gray-500'}`}
        >
          <ShoppingBag className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Modul Ajar</span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center w-full p-2 rounded-lg ${activeTab === 'orders' ? 'text-[#c04a1a] font-bold' : 'text-gray-500'}`}
        >
          <Package className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Pesanan</span>
        </button>
        <button 
          onClick={() => setActiveTab('coupons')}
          className={`flex flex-col items-center justify-center w-full p-2 rounded-lg ${activeTab === 'coupons' ? 'text-[#c04a1a] font-bold' : 'text-gray-500'}`}
        >
          <Ticket className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Kupon</span>
        </button>
      </div>
    </div>
  );
};

export default StoreManagement;
