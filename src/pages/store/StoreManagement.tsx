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
    <div className="planning-layout bg-[#f5f0e8] min-h-screen">
      {/* Sidebar Kiri */}
      <div className="sidebar w-64 flex flex-col justify-between h-screen sticky top-0 border-r-2 border-[#111] bg-[#f5f0e8] z-10 p-6">
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
              <span>Katalog Karya</span>
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

      {/* Konten Kanan */}
      <div className="planning-content flex-1 p-8 h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'profile' && <StoreProfileTab />}
          {activeTab === 'listings' && <StoreListingsTab />}
          {activeTab === 'orders' && <StoreOrdersTab />}
          {activeTab === 'coupons' && <StoreCouponsTab />}
        </div>
      </div>
    </div>
  );
};

export default StoreManagement;
