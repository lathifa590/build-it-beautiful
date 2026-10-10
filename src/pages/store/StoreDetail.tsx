import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Store, FileText, CheckCircle, Download, Ticket, X, Check, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { StoreCoupon } from '@/types/store';

const StoreDetail = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [buyerName, setBuyerName] = useState(user?.user_metadata?.full_name || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<StoreCoupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['storeListing', listingId],
    queryFn: () => storeApi.getListingDetails(listingId as string),
    enabled: !!listingId,
  });

  const basePrice = listing?.price_amount || 0;
  let discountAmount = 0;
  if (appliedCoupon && basePrice > 0) {
    if (appliedCoupon.discount_type === 'PERCENTAGE') {
      discountAmount = Math.round((basePrice * appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount && appliedCoupon.max_discount > 0) {
        discountAmount = Math.min(discountAmount, appliedCoupon.max_discount);
      }
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
    discountAmount = Math.min(discountAmount, basePrice);
  }
  const priceAfterDiscount = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = async () => {
    if (!listing) return;
    const cleanCode = couponCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Masukkan kode promo terlebih dahulu');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await storeApi.validateCoupon(
        listing.store_id, 
        cleanCode, 
        listing.listing_id, 
        basePrice
      );

      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        toast.success(`Kupon "${res.coupon.code}" berhasil diterapkan!`);
      } else {
        toast.error(res.message || 'Kupon tidak dapat digunakan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memvalidasi kupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    toast.info('Kupon dibatalkan');
  };

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!listing) throw new Error("Data modul tidak ditemukan");
      if (!buyerName || !buyerEmail) throw new Error("Nama dan Email wajib diisi");

      const isFree = basePrice === 0 || priceAfterDiscount === 0;
      // Tambahkan kode unik 3 digit acak (100-999) untuk order berbayar agar mudah diverifikasi di mutasi bank
      const uniqueCode = isFree ? 0 : Math.floor(100 + Math.random() * 900);
      const finalAmount = isFree ? 0 : priceAfterDiscount + uniqueCode;
      
      const orderData = {
        invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        store_id: listing.store_id,
        listing_id: listing.listing_id,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        buyer_whatsapp: buyerWhatsapp.trim() || undefined,
        total_amount: finalAmount,
        coupon_code_used: appliedCoupon?.code,
        status: isFree ? 'SELESAI' : 'PENDING_PAYMENT',
      };

      const newOrder = await storeApi.createOrder(orderData as any);

      // Catat penggunaan kupon jika ada kupon yang berhasil dipakai
      if (appliedCoupon?.coupon_id) {
        await storeApi.incrementCouponUsage(appliedCoupon.coupon_id);
      }

      return newOrder;
    },
    onSuccess: (order) => {
      setShowBuyModal(false);
      if (basePrice === 0 || priceAfterDiscount === 0) {
        toast.success("Berhasil klaim modul ajar!");
      }
      navigate(`/checkout/${order?.order_id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Terjadi kesalahan saat memproses pesanan');
    }
  });

  if (isLoading) return <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">Memuat...</div>;
  if (!listing) return <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">Modul tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-[#f5f0e8] pb-12">
      <SEOHead 
        title={`${listing.title} | Global Marketplace ModulAjar.Online`}
        description={listing.description ? listing.description.substring(0, 150) + '...' : `Beli dan unduh ${listing.title} oleh ${listing.store_profile?.store_name || 'Penjual'}.`}
        canonical={`/store/item/${listing.listing_id}`}
      />
      {/* Header */}
      <div className="bg-white border-b-2 border-[#111] sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate(`/store/${listing.store_profile?.store_slug}`)}
          >
            <Store className="w-5 h-5 text-[#111]" />
            <span className="font-black text-sm md:text-base hidden sm:inline">{listing.store_profile?.store_name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 md:mt-10">
        <div className="bg-white rounded-2xl border-2 border-[#111] overflow-hidden flex flex-col md:flex-row shadow-[4px_4px_0_0_#111]">
          {/* Image Section */}
          <div className="w-full md:w-5/12 lg:w-1/3 bg-white md:bg-[#f5f0e8] border-b-2 md:border-b-0 md:border-r-2 border-[#111] flex items-start md:items-center justify-center p-0 md:p-6">
             {listing.preview_image_url ? (
               <img 
                 src={listing.preview_image_url} 
                 alt={listing.title} 
                 className="w-full aspect-[4/3] object-cover md:rounded-xl md:border-2 md:border-[#111] md:shadow-[4px_4px_0_0_#111]" 
               />
             ) : (
               <div className="w-full aspect-[4/3] flex items-center justify-center bg-gray-100 md:bg-white md:rounded-xl md:border-2 md:border-[#111] md:shadow-[4px_4px_0_0_#111]">
                 <FileText className="w-24 h-24 md:w-16 md:h-16 text-gray-300" />
               </div>
             )}
          </div>
          
          {/* Detail Section */}
          <div className="p-6 md:p-8 flex-1 flex flex-col">
            <div className="mb-2">
              <span className="bg-[#f5f0e8] border border-[#111] px-3 py-1 text-xs font-bold rounded-md">
                {listing.category}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-[#111] mt-2 mb-4 leading-tight">{listing.title}</h1>
            
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg w-max cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/store/${listing.store_profile?.store_slug}`)}>
               <div className="w-10 h-10 rounded-full bg-white border border-gray-300 overflow-hidden shrink-0">
                 {listing.store_profile?.avatar_url ? (
                   <img src={listing.store_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <Store className="w-6 h-6 m-2 text-gray-400" />
                 )}
               </div>
               <div>
                 <p className="text-[10px] md:text-xs text-gray-500 font-semibold leading-tight">Dijual oleh</p>
                 <p className="font-bold text-sm leading-tight">{listing.store_profile?.store_name}</p>
               </div>
            </div>

            <div className="prose prose-sm md:prose-base max-w-none text-gray-600 mb-8 whitespace-pre-wrap">
              {listing.description || 'Tidak ada deskripsi.'}
            </div>

            <div className="mt-auto border-t-2 border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-3xl font-black text-[#c04a1a]">
                {listing.price_amount === 0 ? 'Gratis' : `Rp${(listing.price_amount || 0).toLocaleString('id-ID')}`}
              </div>
              <button 
                className="btn-simpan w-full sm:w-auto text-lg px-8 py-3"
                onClick={() => setShowBuyModal(true)}
              >
                {listing.price_amount === 0 ? 'Dapatkan Gratis' : 'Beli Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white w-full max-w-md rounded-2xl border-2 border-[#111] shadow-[8px_8px_0_0_#111] overflow-hidden animate-in fade-in zoom-in-95">
             <div className="p-6 bg-[#f5f0e8] border-b-2 border-[#111]">
               <h2 className="text-xl font-black text-[#111]">
                 {listing.price_amount === 0 ? 'Klaim Modul Gratis' : 'Informasi Pembeli'}
               </h2>
               <p className="text-sm font-semibold text-gray-600 mt-1">Masukkan data Anda untuk pengiriman modul ajar.</p>
             </div>
             <div className="p-6 space-y-4">
               <div className="field-group">
                 <label>Nama Lengkap</label>
                 <input type="text" placeholder="Masukkan nama..." value={buyerName} onChange={e => setBuyerName(e.target.value)} />
               </div>
               <div className="field-group">
                 <label>Email Utama</label>
                 <input type="email" placeholder="email@contoh.com" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} />
                 <p className="text-xs text-gray-500 mt-1">*Link akses/download akan terhubung dengan email ini.</p>
               </div>
               <div className="field-group">
                 <label>Nomor WhatsApp</label>
                 <input 
                   type="tel" 
                   placeholder="Misal: 08123456789" 
                   value={buyerWhatsapp} 
                   onChange={e => setBuyerWhatsapp(e.target.value)} 
                 />
                 <p className="text-xs text-gray-500 mt-1">*Untuk mempermudah konfirmasi pesanan via WhatsApp.</p>
               </div>

                {listing.price_amount > 0 && (
                  <>
                    {/* Kupon Promo / Diskon */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <Ticket className="w-3.5 h-3.5 text-amber-600" />
                        Punya Kode Promo / Kupon?
                      </label>

                      {appliedCoupon ? (
                        <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                              ✓
                            </div>
                            <div>
                              <p className="font-black text-xs text-emerald-900 tracking-wide uppercase">
                                {appliedCoupon.code}
                              </p>
                              <p className="text-[11px] font-bold text-emerald-700">
                                Hemat Rp{discountAmount.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ketik kode kupon..."
                            value={couponCodeInput}
                            onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                            className="text-xs uppercase font-mono font-bold tracking-wider py-2 flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={isValidatingCoupon || !couponCodeInput.trim()}
                            className="px-4 py-2 bg-[#111] hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isValidatingCoupon ? 'Cek...' : 'Terapkan'}
                          </button>
                        </div>
                      )}

                      {/* Rincian Harga jika kupon diterapkan */}
                      {appliedCoupon && (
                        <div className="mt-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded-lg space-y-1 text-xs">
                          <div className="flex justify-between text-gray-500 font-medium">
                            <span>Harga Modul:</span>
                            <span className="line-through">Rp{basePrice.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 font-bold">
                            <span>Diskon Kupon:</span>
                            <span>-Rp{discountAmount.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-[#111] font-black pt-1 border-t border-gray-200">
                            <span>Harga Setelah Diskon:</span>
                            <span className="text-[#c04a1a]">Rp{priceAfterDiscount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase tracking-wider">Metode Pembayaran</label>
                      <div className="p-3 bg-[#f8faff] border-2 border-blue-600 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            🏦
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#111]">{listing.store_profile?.bank_name || 'Bank BRI'}</p>
                            <p className="text-[11px] text-gray-500">Transfer Manual (Konfirmasi WhatsApp)</p>
                          </div>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-gray-200 mt-4 flex gap-3">
                  <button className="btn-secondary w-full" onClick={() => setShowBuyModal(false)} disabled={buyMutation.isPending}>Batal</button>
                  <button className="btn-simpan w-full" onClick={() => buyMutation.mutate()} disabled={buyMutation.isPending}>
                    {buyMutation.isPending ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreDetail;
