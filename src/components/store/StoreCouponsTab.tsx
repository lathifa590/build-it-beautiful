import React, { useState } from 'react';
import { 
  Plus, Ticket, Percent, Coins, Pencil, Copy, Trash2, 
  Check, X, Search, Globe, Target, AlertTriangle, Layers, BookOpen 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreCoupon, StoreListing } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const StoreCouponsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<StoreCoupon | null>(null);
  const [viewingScopeCoupon, setViewingScopeCoupon] = useState<StoreCoupon | null>(null);
  const [listingSearchQuery, setListingSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<StoreCoupon>>({
    discount_type: 'PERCENTAGE',
    status: 'ACTIVE',
    min_purchase: 0,
    max_discount: 0,
    usage_limit: 100,
    scope_type: 'GLOBAL',
    applicable_listing_ids: [],
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

  const { data: storeListings = [] } = useQuery({
    queryKey: ['storeListings', profile?.store_id],
    queryFn: () => storeApi.getStoreListings(profile!.store_id, false),
    enabled: !!profile?.store_id,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.store_id) throw new Error("Profil toko tidak ditemukan");
      
      const cleanCode = formData.code?.toUpperCase().replace(/\s+/g, '');
      if (!cleanCode) throw new Error("Kode kupon wajib diisi");
      if (!formData.discount_value || formData.discount_value <= 0) {
        throw new Error("Nilai diskon harus lebih besar dari 0");
      }

      if (formData.scope_type === 'SPECIFIC') {
        if (!formData.applicable_listing_ids || formData.applicable_listing_ids.length === 0) {
          throw new Error("Pilih minimal 1 modul dari katalog untuk kupon khusus");
        }
      }

      const couponData: Partial<StoreCoupon> = {
        ...formData,
        store_id: profile.store_id,
        code: cleanCode,
        scope_type: formData.scope_type || 'GLOBAL',
        applicable_listing_ids: formData.scope_type === 'SPECIFIC' ? (formData.applicable_listing_ids || []) : [],
      };

      if (editingCouponId) {
        couponData.coupon_id = editingCouponId;
      }

      return storeApi.upsertCoupon(couponData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons', profile?.store_id] });
      toast.success(editingCouponId ? 'Kupon berhasil diperbarui' : 'Kupon berhasil dibuat');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan kupon');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (couponId: string) => {
      return storeApi.deleteCoupon(couponId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons', profile?.store_id] });
      toast.success('Kupon berhasil dihapus');
      setDeleteConfirmCoupon(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus kupon');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (coupon: StoreCoupon) => {
      return storeApi.upsertCoupon({
        coupon_id: coupon.coupon_id,
        status: coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCoupons', profile?.store_id] });
      toast.success('Status kupon diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mengubah status kupon');
    }
  });

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingCouponId(null);
    setListingSearchQuery('');
    setFormData({
      discount_type: 'PERCENTAGE',
      status: 'ACTIVE',
      min_purchase: 0,
      max_discount: 0,
      usage_limit: 100,
      scope_type: 'GLOBAL',
      applicable_listing_ids: [],
    });
  };

  const handleStartCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (coupon: StoreCoupon) => {
    setEditingCouponId(coupon.coupon_id);
    setFormData({
      coupon_id: coupon.coupon_id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase || 0,
      max_discount: coupon.max_discount || 0,
      usage_limit: coupon.usage_limit || 100,
      status: coupon.status,
      scope_type: coupon.scope_type || 'GLOBAL',
      applicable_listing_ids: Array.isArray(coupon.applicable_listing_ids) ? [...coupon.applicable_listing_ids] : [],
    });
    setListingSearchQuery('');
    setIsFormOpen(true);
  };

  const handleDuplicate = (coupon: StoreCoupon) => {
    setEditingCouponId(null);
    setFormData({
      code: `${coupon.code}_COPY`,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase || 0,
      max_discount: coupon.max_discount || 0,
      usage_limit: coupon.usage_limit || 100,
      status: 'ACTIVE',
      scope_type: coupon.scope_type || 'GLOBAL',
      applicable_listing_ids: Array.isArray(coupon.applicable_listing_ids) ? [...coupon.applicable_listing_ids] : [],
    });
    setListingSearchQuery('');
    setIsFormOpen(true);
    toast.info(`Menduplikasi kupon "${coupon.code}". Sesuaikan kode sebelum menyimpan.`);
  };

  const handleToggleListingSelection = (listingId: string) => {
    const current = formData.applicable_listing_ids || [];
    if (current.includes(listingId)) {
      setFormData({
        ...formData,
        applicable_listing_ids: current.filter(id => id !== listingId),
      });
    } else {
      setFormData({
        ...formData,
        applicable_listing_ids: [...current, listingId],
      });
    }
  };

  const handleSelectAllListings = () => {
    const allIds = storeListings.map(l => l.listing_id);
    setFormData({
      ...formData,
      applicable_listing_ids: allIds,
    });
  };

  const handleClearListingSelection = () => {
    setFormData({
      ...formData,
      applicable_listing_ids: [],
    });
  };

  const filteredListings = storeListings.filter(l => {
    if (!listingSearchQuery.trim()) return true;
    const q = listingSearchQuery.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  });

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode kupon "${code}" berhasil disalin!`);
  };

  if (isFormOpen) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="section-heading mb-0 border-none pb-0">
              {editingCouponId ? `Edit Kupon: ${formData.code || ''}` : 'Buat Kupon Diskon'}
            </h3>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              {editingCouponId 
                ? 'Perbarui rincian, besaran diskon, dan cakupan modul ajar untuk kupon ini.' 
                : 'Berikan penawaran promo menarik untuk pembeli Modul Ajar Anda.'}
            </p>
          </div>
          <button className="btn-secondary" onClick={resetForm} disabled={saveMutation.isPending}>
            Batal
          </button>
        </div>

        <div className="card shadow-[4px_4px_0_0_#111]">
          <div className="card-head bg-[#f5f0e8] border-b-2 border-[#111]">
            <h4 className="font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-700" />
              {editingCouponId ? 'Form Edit Kupon' : 'Form Kupon Baru'}
            </h4>
          </div>
          <div className="card-body space-y-5 pt-4">
            {/* Kode Promo */}
            <div className="field-group">
              <label className="font-bold text-sm">Kode Promo (Tanpa Spasi)</label>
              <input 
                type="text" 
                placeholder="Misal: GURUHEBAT, DISKON50, MERDEKA10" 
                value={formData.code || ''}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                className="uppercase font-mono font-bold tracking-wider"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Kode unik yang akan diketik oleh pembeli saat checkout (otomatis huruf kapital).
              </p>
            </div>
            
            {/* Tipe Diskon & Nilai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field-group">
                <label className="font-bold text-sm">Tipe Diskon</label>
                <select 
                  value={formData.discount_type || 'PERCENTAGE'}
                  onChange={e => setFormData({...formData, discount_type: e.target.value as any})}
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="NOMINAL">Nominal Potongan Tetap (Rp)</option>
                </select>
              </div>
              <div className="field-group">
                <label className="font-bold text-sm">Nilai Diskon</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder={formData.discount_type === 'PERCENTAGE' ? 'Misal: 20' : 'Misal: 10000'}
                    value={formData.discount_value || ''}
                    onChange={e => setFormData({...formData, discount_value: Number(e.target.value)})}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-sm text-gray-500">
                    {formData.discount_type === 'PERCENTAGE' ? '%' : 'Rp'}
                  </span>
                </div>
              </div>
            </div>

            {/* CAKUPAN PRODUK / SCOPE SELECTION */}
            <div className="p-4 bg-[#f8fafc] border-2 border-[#111] rounded-xl space-y-4">
              <div>
                <label className="font-black text-sm text-[#111] block mb-1">
                  Cakupan Produk / Berlaku Untuk
                </label>
                <p className="text-xs font-semibold text-gray-600">
                  Tentukan apakah kupon ini dapat digunakan untuk semua modul atau khusus modul tertentu di katalog Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, scope_type: 'GLOBAL'})}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${
                    formData.scope_type !== 'SPECIFIC'
                      ? 'border-[#111] bg-amber-50 shadow-[3px_3px_0_0_#111]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${formData.scope_type !== 'SPECIFIC' ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-600'}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#111] flex items-center gap-1.5">
                      Semua Modul (Global)
                      {formData.scope_type !== 'SPECIFIC' && <Check className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Kupon berlaku untuk seluruh modul ajar yang ada di toko Anda.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({...formData, scope_type: 'SPECIFIC'})}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${
                    formData.scope_type === 'SPECIFIC'
                      ? 'border-[#111] bg-blue-50 shadow-[3px_3px_0_0_#111]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 ${formData.scope_type === 'SPECIFIC' ? 'bg-blue-200 text-blue-900' : 'bg-gray-100 text-gray-600'}`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#111] flex items-center gap-1.5">
                      Modul Tertentu dari Katalog
                      {formData.scope_type === 'SPECIFIC' && <Check className="w-4 h-4 text-blue-700" />}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Kupon hanya dapat digunakan untuk modul ajar tertentu yang Anda centang.
                    </p>
                  </div>
                </button>
              </div>

              {/* LISTING SELECTOR IF SPECIFIC SCOPE */}
              {formData.scope_type === 'SPECIFIC' && (
                <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                      Pilih Modul Ajar ({formData.applicable_listing_ids?.length || 0} Terpilih dari {storeListings.length})
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={handleSelectAllListings}
                        className="font-bold text-blue-700 hover:underline"
                      >
                        Pilih Semua ({storeListings.length})
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={handleClearListingSelection}
                        className="font-bold text-red-600 hover:underline"
                      >
                        Batal Semua
                      </button>
                    </div>
                  </div>

                  {/* Search filter for listings */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari judul modul atau mata pelajaran..."
                      value={listingSearchQuery}
                      onChange={e => setListingSearchQuery(e.target.value)}
                      className="pl-9 text-xs py-2 bg-white"
                    />
                  </div>

                  {storeListings.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-xs font-bold text-yellow-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                      Belum ada modul ajar di katalog toko Anda. Tambahkan modul di menu &quot;Katalog Modul Ajar&quot; terlebih dahulu.
                    </div>
                  ) : filteredListings.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 font-semibold bg-white border rounded-lg">
                      Tidak ada modul yang cocok dengan pencarian &quot;{listingSearchQuery}&quot;
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-gray-200 p-2 rounded-xl bg-white">
                      {filteredListings.map(listing => {
                        const isSelected = (formData.applicable_listing_ids || []).includes(listing.listing_id);
                        return (
                          <div
                            key={listing.listing_id}
                            onClick={() => handleToggleListingSelection(listing.listing_id)}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                                : 'bg-gray-50/50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                isSelected ? 'bg-blue-600 border-blue-700 text-white' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="w-9 h-9 rounded bg-gray-200 overflow-hidden shrink-0 border border-gray-300">
                                {listing.preview_image_url ? (
                                  <img src={listing.preview_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <BookOpen className="w-4 h-4 m-2.5 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-[#111] truncate">{listing.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.2 rounded">
                                    {listing.category || 'Modul'}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-[#c04a1a]">
                                    Rp{(listing.price_amount || 0).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <span className={`text-[11px] font-bold shrink-0 ${isSelected ? 'text-blue-700' : 'text-gray-400'}`}>
                              {isSelected ? 'Aktif' : 'Pilih'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {formData.applicable_listing_ids?.length === 0 && (
                    <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Wajib memilih minimal 1 modul dari katalog jika memilih cakupan Modul Tertentu.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Min Purchase & Usage Limit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field-group">
                <label className="font-bold text-sm">Minimum Pembelian (Rp) (Opsional)</label>
                <input 
                  type="number" 
                  value={formData.min_purchase || 0}
                  onChange={e => setFormData({...formData, min_purchase: Number(e.target.value)})}
                  placeholder="0 (Tidak ada minimum)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Kupon hanya bisa digunakan jika harga modul sama atau melebihi angka ini.
                </p>
              </div>
              <div className="field-group">
                <label className="font-bold text-sm">Batas Penggunaan Maksimal</label>
                <input 
                  type="number" 
                  value={formData.usage_limit || 100}
                  onChange={e => setFormData({...formData, usage_limit: Number(e.target.value)})}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Berapa kali kupon ini dapat digunakan sebelum kuota promo habis.
                </p>
              </div>
            </div>

            {/* Status Kupon */}
            <div className="field-group">
              <label className="font-bold text-sm">Status Kupon</label>
              <select 
                value={formData.status || 'ACTIVE'}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="ACTIVE">Aktif (Dapat Digunakan oleh Pembeli)</option>
                <option value="INACTIVE">Nonaktif (Dimatikan Sementara)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="pt-6 mt-6 border-t-2 border-[#111] flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                className="btn-simpan w-full sm:w-auto" 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Menyimpan...' : editingCouponId ? 'Perbarui Kupon' : 'Simpan Kupon'}
              </button>
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                onClick={resetForm}
                disabled={saveMutation.isPending}
              >
                Batal
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
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            Buat dan kelola kode promo diskon untuk pembeli Modul Ajar Anda.
          </p>
        </div>
        <button className="btn-simpan flex items-center gap-2" onClick={handleStartCreate}>
          <Plus className="w-4 h-4" />
          Buat Kupon
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
        </div>
      ) : coupons && coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => {
            const isSpecific = coupon.scope_type === 'SPECIFIC';
            const specificCount = Array.isArray(coupon.applicable_listing_ids) ? coupon.applicable_listing_ids.length : 0;
            const percentUsed = coupon.usage_limit > 0 ? Math.min(100, Math.round((coupon.used_count / coupon.usage_limit) * 100)) : 0;

            return (
              <div 
                key={coupon.coupon_id} 
                className="card p-5 flex flex-col justify-between border-2 border-[#111] shadow-[4px_4px_0_0_#111] hover:shadow-[6px_6px_0_0_#111] transition-shadow relative"
              >
                <div>
                  {/* Top Bar: Code + Status Badge */}
                  <div className="flex justify-between items-center mb-3">
                    <button 
                      onClick={() => copyCouponCode(coupon.code)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-900 text-sm font-black px-3 py-1 rounded-md tracking-widest uppercase transition-colors flex items-center gap-1.5"
                      title="Klik untuk menyalin kode kupon"
                    >
                      {coupon.code}
                      <Copy className="w-3 h-3 opacity-60" />
                    </button>
                    
                    {coupon.status === 'ACTIVE' ? (
                      <button
                        onClick={() => toggleMutation.mutate(coupon)}
                        disabled={toggleMutation.isPending}
                        className="bg-green-100 text-green-800 border-2 border-green-800 text-xs font-bold px-2 py-0.5 rounded hover:bg-green-200 transition-colors"
                        title="Klik untuk menonaktifkan"
                      >
                        Aktif
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleMutation.mutate(coupon)}
                        disabled={toggleMutation.isPending}
                        className="bg-gray-100 text-gray-700 border-2 border-gray-600 text-xs font-bold px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                        title="Klik untuk mengaktifkan"
                      >
                        Nonaktif
                      </button>
                    )}
                  </div>

                  {/* Diskon Value */}
                  <div className="flex items-center gap-2 mb-2 text-2xl font-black text-[#111]">
                    {coupon.discount_type === 'PERCENTAGE' ? <Percent className="w-6 h-6 text-amber-600" /> : <Coins className="w-6 h-6 text-amber-600" />}
                    {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}% Diskon` : `Rp${coupon.discount_value.toLocaleString('id-ID')} Diskon`}
                  </div>

                  {/* Cakupan Produk Badge */}
                  <div className="mb-3">
                    {isSpecific ? (
                      <button
                        type="button"
                        onClick={() => setViewingScopeCoupon(coupon)}
                        className="w-full text-left inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-400 hover:bg-blue-200 transition-colors"
                        title="Klik untuk melihat daftar modul yang berlaku"
                      >
                        <Target className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className="truncate">Khusus {specificCount} Modul Tertentu</span>
                        <span className="text-[10px] underline ml-auto shrink-0">Lihat</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-400">
                        <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        Berlaku untuk Semua Modul
                      </span>
                    )}
                  </div>

                  {/* Min Purchase */}
                  <div className="text-xs font-semibold text-gray-600 mb-4">
                    Min. Pembelian: {coupon.min_purchase > 0 ? `Rp${coupon.min_purchase.toLocaleString('id-ID')}` : 'Tidak Ada'}
                  </div>
                </div>

                {/* Footer: Usage Progress & Action Buttons */}
                <div className="pt-3 border-t-2 border-gray-200 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>Terpakai:</span>
                      <span>{coupon.used_count} / {coupon.usage_limit} ({percentUsed}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons: Edit, Duplicate, Delete */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleStartEdit(coupon)}
                      className="px-2.5 py-1 text-xs font-bold border border-gray-400 rounded bg-white hover:bg-gray-100 flex items-center gap-1 transition-colors"
                      title="Edit Kupon"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDuplicate(coupon)}
                      className="px-2.5 py-1 text-xs font-bold border border-gray-400 rounded bg-white hover:bg-gray-100 flex items-center gap-1 transition-colors"
                      title="Duplikat Kupon"
                    >
                      <Copy className="w-3 h-3" />
                      Duplikat
                    </button>

                    <button
                      onClick={() => setDeleteConfirmCoupon(coupon)}
                      className="p-1 text-xs font-bold border border-red-300 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      title="Hapus Kupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card shadow-[4px_4px_0_0_#111]">
          <div className="card-body flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-[#f5f0e8] border-2 border-[#111] rounded-full flex items-center justify-center mb-4 shadow-[2px_2px_0_0_#111]">
              <Ticket className="w-8 h-8 text-[#111]" />
            </div>
            <h4 className="text-lg font-black mb-1">Belum ada kupon diskon</h4>
            <p className="text-sm font-semibold text-muted-foreground max-w-sm mb-4">
              Buat promosi khusus untuk menarik lebih banyak pembeli Modul Ajar Anda.
            </p>
            <button className="btn-simpan" onClick={handleStartCreate}>
              Buat Kupon Pertama
            </button>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS KUPON */}
      {deleteConfirmCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl border-2 border-[#111] shadow-[8px_8px_0_0_#111] overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h4 className="font-black text-base text-[#111]">Hapus Kupon?</h4>
                <p className="text-xs font-bold text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 font-medium">
              Apakah Anda yakin ingin menghapus kupon <span className="font-black text-red-700 uppercase bg-red-50 px-1 rounded border border-red-200">{deleteConfirmCoupon.code}</span>? Pembeli tidak akan bisa lagi menggunakan kupon ini.
            </p>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button 
                className="btn-secondary w-full text-xs py-2" 
                onClick={() => setDeleteConfirmCoupon(null)}
                disabled={deleteMutation.isPending}
              >
                Batal
              </button>
              <button 
                className="w-full text-xs py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg border-2 border-[#111] shadow-[2px_2px_0_0_#111] transition-all"
                onClick={() => deleteMutation.mutate(deleteConfirmCoupon.coupon_id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAFTAR MODUL TERKAIT KUPON */}
      {viewingScopeCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border-2 border-[#111] shadow-[8px_8px_0_0_#111] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 bg-[#f5f0e8] border-b-2 border-[#111] flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-[#111]">Modul yang Berlaku</h4>
                <p className="text-xs font-bold text-gray-600">Kupon: <span className="uppercase font-mono">{viewingScopeCoupon.code}</span></p>
              </div>
              <button 
                onClick={() => setViewingScopeCoupon(null)}
                className="p-1 rounded-md hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {(() => {
                const allowedIds = Array.isArray(viewingScopeCoupon.applicable_listing_ids) 
                  ? viewingScopeCoupon.applicable_listing_ids 
                  : [];
                const matchedListings = storeListings.filter(l => allowedIds.includes(l.listing_id));

                if (matchedListings.length === 0) {
                  return (
                    <div className="text-center py-6 text-gray-500 text-xs font-semibold">
                      Belum ada modul yang ditautkan ke kupon ini.
                    </div>
                  );
                }

                return matchedListings.map(listing => (
                  <div key={listing.listing_id} className="p-2.5 bg-gray-50 border rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0 border border-gray-300">
                      {listing.preview_image_url ? (
                        <img src={listing.preview_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-4 h-4 m-3 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#111] truncate">{listing.title}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{listing.category} • Rp{(listing.price_amount || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
              <button 
                className="btn-secondary text-xs px-4 py-1.5"
                onClick={() => setViewingScopeCoupon(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCouponsTab;
