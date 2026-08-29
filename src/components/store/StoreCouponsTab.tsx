import React, { useState } from 'react';
import { Plus, Ticket, Percent, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreCoupon } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const StoreCouponsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState<Partial<StoreCoupon>>({
    discount_type: 'PERCENTAGE',
    status: 'ACTIVE',
    min_purchase: 0,
    max_discount: 0,
    usage_limit: 100,
  });

  // Queries
  const { data: profile } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['storeCoupons', profile?.store_id],
    queryFn: () => storeApi.getStoreCoupons(profile!.store_id),
    enabled: !!profile?.store_id,
  });

  // Mutations
  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile?.store_id) throw new Error("Profil toko tidak ditemukan");
      
      const couponData = {
        ...formData,
        store_id: profile.store_id,
        code: formData.code?.toUpperCase().replace(/\s+/g, ''),
      };

      return storeApi.upsertCoupon(couponData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons', profile?.store_id] });
      toast.success('Kupon berhasil disimpan');
      setIsAddingNew(false);
      setFormData({ 
        discount_type: 'PERCENTAGE',
        status: 'ACTIVE',
        min_purchase: 0,
        max_discount: 0,
        usage_limit: 100,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan kupon');
    }
  });

  const handleSubmit = () => {
    if (!formData.code || !formData.discount_value) {
      toast.error('Kode kupon dan nilai diskon wajib diisi');
      return;
    }
    mutation.mutate();
  };

  if (isAddingNew) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="section-heading mb-0 border-none pb-0">Buat Kupon Diskon</h3>
            <p className="text-sm font-semibold text-muted-foreground mt-1">Berikan penawaran menarik untuk pembeli Modul Ajar Anda.</p>
          </div>
          <button className="btn-secondary" onClick={() => setIsAddingNew(false)} disabled={mutation.isPending}>
            Batal
          </button>
        </div>

        <div className="card">
          <div className="card-head">
            <h4 className="font-bold">Detail Kupon</h4>
          </div>
          <div className="card-body space-y-4 pt-4">
            <div className="field-group">
              <label>Kode Promo (Tanpa Spasi)</label>
              <input 
                type="text" 
                placeholder="Misal: GURUHEBAT" 
                value={formData.code || ''}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="uppercase"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field-group">
                <label>Tipe Diskon</label>
                <select 
                  value={formData.discount_type || 'PERCENTAGE'}
                  onChange={e => setFormData({...formData, discount_type: e.target.value as any})}
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="NOMINAL">Nominal (Rp)</option>
                </select>
              </div>
              <div className="field-group">
                <label>Nilai Diskon</label>
                <input 
                  type="number" 
                  placeholder={formData.discount_type === 'PERCENTAGE' ? 'Misal: 20' : 'Misal: 10000'}
                  value={formData.discount_value || ''}
                  onChange={e => setFormData({...formData, discount_value: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field-group">
                <label>Minimum Pembelian (Rp) (Opsional)</label>
                <input 
                  type="number" 
                  value={formData.min_purchase || 0}
                  onChange={e => setFormData({...formData, min_purchase: Number(e.target.value)})}
                />
              </div>
              <div className="field-group">
                <label>Batas Penggunaan Maksimal</label>
                <input 
                  type="number" 
                  value={formData.usage_limit || 100}
                  onChange={e => setFormData({...formData, usage_limit: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="field-group">
              <label>Status Kupon</label>
              <select 
                value={formData.status || 'ACTIVE'}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="ACTIVE">Aktif (Dapat Digunakan)</option>
                <option value="INACTIVE">Nonaktif (Dimatikan)</option>
              </select>
            </div>

            <div className="pt-6 mt-6 border-t-2 border-[#111]">
              <button 
                className="btn-simpan w-full md:w-auto" 
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Menyimpan...' : 'Simpan Kupon'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="section-heading mb-0 border-none pb-0">Kupon Diskon</h3>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Buat dan kelola kode promo untuk pembeli Modul Ajar Anda.</p>
        </div>
        <button className="btn-simpan flex items-center gap-2" onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4" />
          Buat Kupon
        </button>
      </div>
      
      {isLoading ? (
        <div>Memuat kupon...</div>
      ) : coupons && coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <div key={coupon.coupon_id} className="card p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-100 text-amber-800 border-2 border-amber-800 text-sm font-black px-3 py-1 rounded-md tracking-widest uppercase">
                  {coupon.code}
                </div>
                {coupon.status === 'ACTIVE' ? (
                  <span className="bg-green-100 text-green-800 border border-green-800 text-xs font-bold px-2 py-1 rounded">Aktif</span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 border border-gray-800 text-xs font-bold px-2 py-1 rounded">Nonaktif</span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2 text-xl font-black text-[#111]">
                {coupon.discount_type === 'PERCENTAGE' ? <Percent className="w-5 h-5 text-amber-600" /> : <Coins className="w-5 h-5 text-amber-600" />}
                {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}% Diskon` : `Rp${coupon.discount_value.toLocaleString('id-ID')} Diskon`}
              </div>
              
              <div className="text-sm font-semibold text-muted-foreground mb-4">
                Min. Pembelian: {coupon.min_purchase > 0 ? `Rp${coupon.min_purchase.toLocaleString('id-ID')}` : 'Tidak Ada'}
              </div>
              
              <div className="mt-auto pt-4 border-t-2 border-border flex justify-between text-sm">
                <span className="font-semibold">Terpakai:</span>
                <span className="font-bold">{coupon.used_count} / {coupon.usage_limit}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-[#f5f0e8] border-2 border-[#111] rounded-full flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-[#111]" />
            </div>
            <h4 className="text-lg font-black mb-1">Belum ada kupon diskon</h4>
            <p className="text-sm font-semibold text-muted-foreground max-w-sm mb-4">
              Buat promosi khusus untuk menarik lebih banyak pembeli Modul Ajar Anda.
            </p>
            <button className="btn-secondary" onClick={() => setIsAddingNew(true)}>
              Buat Kupon Pertama
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCouponsTab;
