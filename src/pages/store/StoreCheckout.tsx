import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { CheckCircle, Clock, Upload, ArrowLeft, Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const StoreCheckout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['storeOrder', orderId],
    queryFn: () => storeApi.getOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: (data) => (data?.status === 'PENDING_REVIEW' ? 5000 : false), // Polling if waiting for admin
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Pesanan tidak ditemukan");
      if (!proofFile) throw new Error("Silakan pilih file bukti transfer");

      const filePath = `payments/${order.order_id}_${Date.now()}_${proofFile.name}`;
      const url = await storeApi.uploadStoreAsset(filePath, proofFile);

      if (!url) throw new Error("Gagal mengunggah bukti transfer");

      return storeApi.updateOrderStatus(order.order_id, {
        status: 'PENDING_REVIEW',
        payment_proof_url: url,
        uploaded_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Bukti transfer berhasil diunggah! Menunggu konfirmasi penjual.");
      queryClient.invalidateQueries({ queryKey: ['storeOrder', orderId] });
      setProofFile(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah');
    }
  });

  if (isLoading) return <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">Memuat data pesanan...</div>;
  if (!order) return <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">Pesanan tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>

        <div className="bg-white rounded-2xl border-2 border-[#111] shadow-[8px_8px_0_0_#111] overflow-hidden">
          {/* Header Status */}
          <div className={`p-6 border-b-2 border-[#111] flex items-center gap-4 ${
            order.status === 'SELESAI' ? 'bg-green-100' :
            order.status === 'PENDING_REVIEW' ? 'bg-blue-100' :
            'bg-amber-100'
          }`}>
            {order.status === 'SELESAI' ? (
              <CheckCircle className="w-8 h-8 text-green-700" />
            ) : order.status === 'PENDING_REVIEW' ? (
              <Clock className="w-8 h-8 text-blue-700" />
            ) : (
              <Receipt className="w-8 h-8 text-amber-700" />
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#111]">
                {order.status === 'SELESAI' ? 'Pembayaran Berhasil' :
                 order.status === 'PENDING_REVIEW' ? 'Menunggu Konfirmasi' :
                 'Selesaikan Pembayaran'}
              </h1>
              <p className="text-sm font-semibold text-gray-700">
                Invoice: {order.invoice_number}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Order Details */}
            <div>
              <h3 className="font-bold text-lg border-b-2 border-gray-100 pb-2 mb-4">Ringkasan Pesanan</h3>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded-md overflow-hidden shrink-0">
                  {order.listing?.preview_image_url && (
                    <img src={order.listing.preview_image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#111] leading-tight">{order.listing?.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{order.listing?.store_profile?.store_name}</p>
                  <p className="text-lg font-black text-[#c04a1a] mt-2">
                    {order.total_amount === 0 ? 'Gratis' : `Rp${(order.total_amount || 0).toLocaleString('id-ID')}`}
                  </p>
                </div>
              </div>
            </div>

            {/* SELESAI */}
            {order.status === 'SELESAI' && (
              <div className="bg-green-50 border-2 border-green-800 rounded-xl p-6 text-center">
                <h3 className="font-black text-green-800 text-lg mb-2">Modul Ajar Siap Diunduh!</h3>
                <p className="text-sm text-green-700 mb-6">Terima kasih telah berbelanja. Anda sekarang bisa mengakses modul ajar ini.</p>
                {order.listing?.url_modul_ajar ? (
                   <button 
                     className="btn-simpan w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-green-700 text-white border-green-900 shadow-[4px_4px_0_0_#14532d] hover:bg-green-800"
                     onClick={() => window.open(order.listing!.url_modul_ajar!, '_blank')}
                   >
                     <Download className="w-5 h-5" />
                     Download Modul Ajar
                   </button>
                ) : (
                   <div className="text-sm text-red-600 font-bold p-3 bg-red-50 border border-red-200 rounded">
                     Maaf, tautan file tidak tersedia. Silakan hubungi penjual.
                   </div>
                )}
              </div>
            )}

            {/* PENDING_REVIEW */}
            {order.status === 'PENDING_REVIEW' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <Clock className="w-12 h-12 text-blue-300 mx-auto mb-3 animate-pulse" />
                <h3 className="font-bold text-blue-900 mb-2">Bukti Transfer Sedang Diverifikasi</h3>
                <p className="text-sm text-blue-700">Penjual akan mengecek bukti pembayaran Anda. Halaman ini akan otomatis diperbarui setelah pembayaran dikonfirmasi.</p>
              </div>
            )}

            {/* PENDING_PAYMENT */}
            {order.status === 'PENDING_PAYMENT' && (
              <div className="space-y-6">
                <div className="bg-[#f5f0e8] border border-[#111] rounded-xl p-6">
                  <h3 className="font-bold text-[#111] mb-2">Instruksi Pembayaran</h3>
                  <p className="text-sm text-gray-700 mb-4">Silakan transfer sebesar <strong>Rp{order.total_amount.toLocaleString('id-ID')}</strong> ke rekening berikut:</p>
                  
                  <div className="bg-white border-2 border-[#111] p-4 rounded-lg flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-gray-500">Bank BCA</p>
                      <p className="font-black text-xl tracking-wider">123 456 7890</p>
                      <p className="text-sm font-semibold">a.n ModulAjar Store (Dummy)</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 font-bold">*Ini adalah metode pembayaran simulasi/dummy untuk keperluan testing.</p>
                </div>

                <div className="card border-2 border-[#111]">
                  <div className="card-head bg-gray-50">
                    <h4 className="font-bold">Konfirmasi Pembayaran</h4>
                  </div>
                  <div className="card-body p-6">
                    <p className="text-sm text-gray-600 mb-4">Setelah melakukan transfer, silakan unggah foto bukti transfer di bawah ini.</p>
                    
                    <div className="mb-4">
                      <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#111] hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="font-semibold text-gray-600">
                          {proofFile ? proofFile.name : 'Pilih File Bukti Transfer (JPG/PNG/PDF)'}
                        </span>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setProofFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <button 
                      className="btn-simpan w-full flex items-center justify-center gap-2"
                      onClick={() => uploadMutation.mutate()}
                      disabled={!proofFile || uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah & Konfirmasi'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreCheckout;
