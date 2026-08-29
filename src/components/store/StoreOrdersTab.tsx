import React from 'react';
import { Package } from 'lucide-react';

const StoreOrdersTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="section-heading mb-0 border-none pb-0">Pesanan Masuk</h3>
        <p className="text-sm font-semibold text-muted-foreground mt-1">Pantau dan kelola pembelian Modul Ajar Anda.</p>
      </div>
      
      <div className="card">
        <div className="card-body flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-[#f5f0e8] border-2 border-[#111] rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-[#111]" />
          </div>
          <h4 className="text-lg font-black mb-1">Belum ada pesanan</h4>
          <p className="text-sm font-semibold text-muted-foreground max-w-sm">
            Saat ini belum ada pembeli yang memesan Modul Ajar Anda.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoreOrdersTab;
