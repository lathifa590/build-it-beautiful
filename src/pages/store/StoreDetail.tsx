import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Store, FileText, CheckCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

const StoreDetail = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [buyerName, setBuyerName] = useState(user?.user_metadata?.full_name || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [showBuyModal, setShowBuyModal] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['storeListing', listingId],
    queryFn: () => storeApi.getListingDetails(listingId as string),
    enabled: !!listingId,
  });

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!listing) throw new Error("Data modul tidak ditemukan");
      if (!buyerName || !buyerEmail) throw new Error("Nama dan Email wajib diisi");

      const isFree = listing.price_amount === 0;
      
      const orderData = {
        invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        store_id: listing.store_id,
        listing_id: listing.listing_id,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        total_amount: listing.price_amount,
        status: isFree ? 'SELESAI' : 'PENDING_PAYMENT',
      };

      return storeApi.createOrder(orderData as any);
    },
    onSuccess: (order) => {
      setShowBuyModal(false);
      if (listing?.price_amount === 0) {
        toast.success("Berhasil mendapatkan modul ajar gratis!");
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
          <div className="w-full md:w-5/12 lg:w-1/3 bg-gray-100 border-b-2 md:border-b-0 md:border-r-2 border-[#111] flex items-center justify-center relative aspect-square md:aspect-auto">
             {listing.preview_image_url ? (
               <img src={listing.preview_image_url} alt={listing.title} className="w-full h-full object-cover" />
             ) : (
               <FileText className="w-24 h-24 text-gray-300" />
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

               <div className="pt-4 border-t border-gray-200 mt-4 flex gap-3">
                 <button className="btn-secondary w-full" onClick={() => setShowBuyModal(false)} disabled={buyMutation.isPending}>Batal</button>
                 <button className="btn-simpan w-full" onClick={() => buyMutation.mutate()} disabled={buyMutation.isPending}>
                   {buyMutation.isPending ? 'Memproses...' : 'Lanjutkan'}
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
